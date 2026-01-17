"""MCP Installation Engine with Windows support."""
import json
import platform
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple


@dataclass
class InstallationResult:
    """Result of an installation attempt."""
    success: bool
    command_path: Optional[str] = None
    args: Optional[List[str]] = None
    env_vars: Optional[Dict[str, str]] = None
    error_message: Optional[str] = None
    rollback_commands: Optional[List[str]] = None


class MCPInstaller:
    """Orchestrates MCP installation with fallbacks and validation."""

    def __init__(self, project_dir: str, config_path: str = ".mcp.json"):
        """
        Initialize MCP installer.

        Args:
            project_dir: Project root directory
            config_path: Relative path to .mcp.json config file
        """
        self.project_dir = Path(project_dir)
        self.config_path = self.project_dir / config_path
        self.claude_config_path = self.project_dir / ".claude" / "settings.local.json"
        self.is_windows = platform.system() == "Windows"

    def install_mcp(
        self,
        mcp_name: str,
        metadata: Dict,
        env_vars: Dict[str, str]
    ) -> InstallationResult:
        """
        Main installation orchestration with fallbacks.

        Args:
            mcp_name: Name/ID of the MCP to install
            metadata: MCP metadata from database
            env_vars: User-provided environment variables

        Returns:
            InstallationResult with success status and details
        """
        # Step 1: Check prerequisites
        prereq_ok, prereq_error = self._check_prerequisites(metadata)
        if not prereq_ok:
            return InstallationResult(
                success=False,
                error_message=f"Prerequisites not met: {prereq_error}"
            )

        # Step 2: Backup current configuration
        backup_path = self._backup_config()

        try:
            # Step 3: Try installation methods in order
            installation = metadata.get("installation", {})
            methods = installation.get("methods", {})
            primary_method = installation.get("primary_method", "manual")

            # Try primary method first
            if primary_method in methods:
                result = self._try_installation_method(
                    mcp_name,
                    primary_method,
                    methods[primary_method],
                    metadata
                )

                if result.success:
                    # Step 4: Configure environment variables
                    result.env_vars = env_vars

                    # Step 5: Update .mcp.json
                    config_updated = self._update_config(mcp_name, result, metadata)
                    if not config_updated:
                        self._restore_backup(backup_path)
                        return InstallationResult(
                            success=False,
                            error_message="Failed to update configuration"
                        )

                    # Success! Remove backup
                    if backup_path and backup_path.exists():
                        backup_path.unlink()

                    return result

            # If primary method failed, return error
            return InstallationResult(
                success=False,
                error_message=f"Installation method '{primary_method}' failed or not available. Please install manually following: {metadata.get('documentation', 'N/A')}"
            )

        except Exception as e:
            # Restore backup on any error
            self._restore_backup(backup_path)
            return InstallationResult(
                success=False,
                error_message=f"Installation error: {str(e)}"
            )

    def _check_prerequisites(self, metadata: Dict) -> Tuple[bool, Optional[str]]:
        """Check system prerequisites for installation."""
        installation = metadata.get("installation", {})
        primary_method = installation.get("primary_method", "manual")
        methods = installation.get("methods", {})

        if primary_method not in methods:
            return True, None  # Manual installation, no prereqs

        method_config = methods[primary_method]
        requirements = method_config.get("requirements", {})

        for tool, version_spec in requirements.items():
            if tool == "node":
                ok, error = self._check_node_version(version_spec)
            elif tool == "python":
                ok, error = self._check_python_version(version_spec)
            elif tool == "npm":
                ok, error = self._check_npm_available()
            elif tool == "docker":
                ok, error = self._check_docker_available()
            else:
                continue

            if not ok:
                return False, error

        return True, None

    def _check_node_version(self, version_spec: str) -> Tuple[bool, Optional[str]]:
        """Check if Node.js meets version requirement."""
        try:
            result = subprocess.run(
                ["node", "--version"],
                capture_output=True,
                text=True,
                shell=self.is_windows,
                timeout=5
            )
            if result.returncode != 0:
                return False, "Node.js not found"

            version = result.stdout.strip().lstrip('v')

            if not self._version_satisfies(version, version_spec):
                return False, f"Node.js {version_spec} required, found {version}"

            return True, None
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False, "Node.js not installed. Install from https://nodejs.org/"

    def _check_python_version(self, version_spec: str) -> Tuple[bool, Optional[str]]:
        """Check if Python meets version requirement."""
        try:
            result = subprocess.run(
                ["python", "--version"],
                capture_output=True,
                text=True,
                shell=self.is_windows,
                timeout=5
            )
            if result.returncode != 0:
                return False, "Python not found"

            version_match = re.search(r'(\d+\.\d+\.\d+)', result.stdout)
            if not version_match:
                return False, "Could not determine Python version"

            version = version_match.group(1)

            if not self._version_satisfies(version, version_spec):
                return False, f"Python {version_spec} required, found {version}"

            return True, None
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False, "Python not installed. Install from https://python.org/"

    def _check_npm_available(self) -> Tuple[bool, Optional[str]]:
        """Check if npm is available."""
        try:
            result = subprocess.run(
                ["npm", "--version"],
                capture_output=True,
                shell=self.is_windows,
                timeout=5
            )
            return result.returncode == 0, None if result.returncode == 0 else "npm not found"
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False, "npm not found. Install Node.js from https://nodejs.org/"

    def _check_docker_available(self) -> Tuple[bool, Optional[str]]:
        """Check if Docker is available."""
        try:
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                shell=self.is_windows,
                timeout=5
            )
            return result.returncode == 0, None if result.returncode == 0 else "Docker not found"
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False, "Docker not installed. Install from https://docker.com/"

    def _version_satisfies(self, version: str, spec: str) -> bool:
        """Check if version satisfies specification."""
        if spec.startswith(">="):
            required = spec[2:].strip()
            return self._compare_versions(version, required) >= 0
        elif spec.startswith(">"):
            required = spec[1:].strip()
            return self._compare_versions(version, required) > 0
        elif spec.startswith("==") or spec.startswith("="):
            required = spec.lstrip("=").strip()
            return self._compare_versions(version, required) == 0
        else:
            return self._compare_versions(version, spec) >= 0

    def _compare_versions(self, v1: str, v2: str) -> int:
        """Compare two version strings. Returns -1, 0, or 1."""
        parts1 = [int(x) for x in v1.split('.')]
        parts2 = [int(x) for x in v2.split('.')]

        max_len = max(len(parts1), len(parts2))
        parts1.extend([0] * (max_len - len(parts1)))
        parts2.extend([0] * (max_len - len(parts2)))

        for p1, p2 in zip(parts1, parts2):
            if p1 < p2:
                return -1
            elif p1 > p2:
                return 1

        return 0

    def _try_installation_method(
        self,
        mcp_name: str,
        method_name: str,
        method_config: Dict,
        metadata: Dict
    ) -> InstallationResult:
        """Try a specific installation method."""
        if method_name == "npm":
            return self._install_npm(mcp_name, method_config)
        elif method_name == "npx":
            return self._install_npx(mcp_name, method_config)
        elif method_name == "pip":
            return self._install_pip(mcp_name, method_config)
        elif method_name == "manual":
            return InstallationResult(
                success=False,
                error_message=f"Manual installation required. See: {method_config.get('documentation_url', metadata.get('documentation', 'N/A'))}"
            )
        else:
            return InstallationResult(
                success=False,
                error_message=f"Unknown installation method: {method_name}"
            )

    def _install_npx(self, mcp_name: str, config: Dict) -> InstallationResult:
        """Install using npx (on-demand execution)."""
        package = config.get("package")
        if not package:
            return InstallationResult(
                success=False,
                error_message="No package name specified for npx installation"
            )

        try:
            # Verify package exists in npm registry
            verify_cmd = ["npm", "view", package, "version"]
            verify_result = subprocess.run(
                verify_cmd,
                capture_output=True,
                shell=self.is_windows,
                timeout=15,
                text=True
            )

            if verify_result.returncode != 0:
                stderr = verify_result.stderr.lower()
                if "404" in stderr or "not found" in stderr or "not in this registry" in stderr:
                    return InstallationResult(
                        success=False,
                        error_message=f"Package '{package}' not found in npm registry."
                    )
                else:
                    return InstallationResult(
                        success=False,
                        error_message=f"Failed to verify package: {verify_result.stderr}"
                    )

            return InstallationResult(
                success=True,
                command_path="npx",
                args=["-y", package],
                env_vars={}
            )

        except subprocess.TimeoutExpired:
            return InstallationResult(
                success=False,
                error_message="NPX test timed out"
            )
        except Exception as e:
            return InstallationResult(
                success=False,
                error_message=f"NPX test error: {str(e)}"
            )

    def _install_npm(self, mcp_name: str, config: Dict) -> InstallationResult:
        """Install NPM package (project-local)."""
        package = config.get("package")
        if not package:
            return InstallationResult(
                success=False,
                error_message="No package name specified for npm installation"
            )

        try:
            # Create package.json if not exists
            package_json = self.project_dir / "package.json"
            if not package_json.exists():
                self._init_npm_project()

            # Install package locally
            cmd = ["npm", "install", package]
            result = subprocess.run(
                cmd,
                cwd=str(self.project_dir),
                capture_output=True,
                shell=self.is_windows,
                timeout=120
            )

            if result.returncode != 0:
                return InstallationResult(
                    success=False,
                    error_message=f"npm install failed: {result.stderr.decode()}"
                )

            return InstallationResult(
                success=True,
                command_path="npx",
                args=[package],
                env_vars={},
                rollback_commands=[f"npm uninstall {package}"]
            )

        except subprocess.TimeoutExpired:
            return InstallationResult(
                success=False,
                error_message="npm install timed out"
            )
        except Exception as e:
            return InstallationResult(
                success=False,
                error_message=f"NPM installation error: {str(e)}"
            )

    def _install_pip(self, mcp_name: str, config: Dict) -> InstallationResult:
        """Install Python package in virtual environment."""
        package = config.get("package")
        if not package:
            return InstallationResult(
                success=False,
                error_message="No package name specified for pip installation"
            )

        try:
            # Create venv if not exists
            venv_path = self.project_dir / ".venv"
            if not venv_path.exists():
                subprocess.run(
                    ["python", "-m", "venv", str(venv_path)],
                    check=True,
                    shell=self.is_windows,
                    timeout=60
                )

            # Determine pip and python paths
            if self.is_windows:
                pip_path = venv_path / "Scripts" / "pip.exe"
                python_path = venv_path / "Scripts" / "python.exe"
            else:
                pip_path = venv_path / "bin" / "pip"
                python_path = venv_path / "bin" / "python"

            # Install package
            cmd = [str(pip_path), "install", package]
            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=120,
                cwd=str(self.project_dir)
            )

            if result.returncode != 0:
                return InstallationResult(
                    success=False,
                    error_message=f"pip install failed: {result.stderr.decode()}"
                )

            module_name = config.get("module", package.split('[')[0])

            return InstallationResult(
                success=True,
                command_path=str(python_path),
                args=["-m", module_name],
                env_vars={},
                rollback_commands=[f"{pip_path} uninstall -y {package}"]
            )

        except subprocess.TimeoutExpired:
            return InstallationResult(
                success=False,
                error_message="pip install timed out"
            )
        except Exception as e:
            return InstallationResult(
                success=False,
                error_message=f"pip installation error: {str(e)}"
            )

    def _init_npm_project(self):
        """Initialize npm project with minimal package.json."""
        package_json = {
            "name": "mcp-project",
            "version": "1.0.0",
            "description": "MCP servers installation",
            "private": True
        }

        with open(self.project_dir / "package.json", 'w') as f:
            json.dump(package_json, f, indent=2)

    def _update_config(
        self,
        mcp_name: str,
        result: InstallationResult,
        metadata: Dict
    ) -> bool:
        """Update .mcp.json with new MCP configuration."""
        try:
            # Load existing config
            if self.config_path.exists():
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            else:
                config = {"mcpServers": {}}

            # Build environment variables
            env_vars = dict(result.env_vars or {})

            # Get command generation template if available
            cmd_gen = metadata.get("configuration", {}).get("command_generation", {})
            platform_key = "windows" if self.is_windows else "unix"
            template = cmd_gen.get(platform_key, {})

            # Build MCP server configuration
            mcp_config = {
                "type": metadata.get("configuration", {}).get("type", "stdio"),
                "command": result.command_path or template.get("command", ""),
                "args": result.args or template.get("args", []),
                "env": env_vars
            }

            # Add to config
            config["mcpServers"][mcp_name] = mcp_config

            # Write atomically
            temp_path = self.config_path.with_suffix('.tmp')
            with open(temp_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)

            temp_path.replace(self.config_path)

            return True

        except Exception as e:
            print(f"Config update error: {e}")
            return False

    def _backup_config(self) -> Optional[Path]:
        """Backup current configuration."""
        if self.config_path.exists():
            backup_path = self.config_path.with_suffix('.backup')
            shutil.copy2(self.config_path, backup_path)
            return backup_path
        return None

    def _restore_backup(self, backup_path: Optional[Path]):
        """Restore configuration from backup."""
        if backup_path and backup_path.exists():
            shutil.copy2(backup_path, self.config_path)
            backup_path.unlink()
