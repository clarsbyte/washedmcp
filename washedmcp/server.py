"""CleanMCP server - MCP recommender and auto-installer with JSON-based logging."""
from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from mcp.server.fastmcp import FastMCP

from tools.find_mcp import get_mcp_names, format_for_claude_code, MCPInfo
from json_storage import JSONStorage

# Initialize MCP server
mcp = FastMCP("cleanMCP")

# Initialize JSON storage for tool call logging
_storage = JSONStorage()


def _format_timestamp(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


@mcp.tool()
def recommend_mcp_servers(user_context: str) -> str:
    """
    Recommend MCP servers based on user's needs and context.

    Args:
        user_context: Description of what the user wants to accomplish

    Returns:
        Formatted list of recommended MCP servers with installation links

    Example:
        recommend_mcp_servers("I need to automate browser testing and take screenshots")
    """
    try:
        # Get recommendations from Gemini
        recommended_mcps = get_mcp_names(context=user_context)

        # Format for display
        return format_for_claude_code(recommended_mcps)
    except Exception as e:
        return f"Error getting recommendations: {str(e)}"


@mcp.tool()
def list_all_mcp_servers() -> str:
    """
    List all available MCP servers in the database.

    Returns:
        Formatted list of all MCP servers
    """
    try:
        all_mcps = get_mcp_names()  # No context = returns all
        return format_for_claude_code(all_mcps)
    except Exception as e:
        return f"Error listing MCPs: {str(e)}"


@mcp.tool()
def install_mcp_server(
    mcp_name: str,
    env_vars: Optional[Dict[str, Any]] = None
) -> str:
    """
    Install an MCP server automatically.

    This tool EXECUTES the complete installation process:
    1. Checks system prerequisites (Node.js, npm, Python)
    2. Installs the package using the appropriate method (npm, npx, pip)
    3. Configures environment variables in .mcp.json
    4. Updates .mcp.json with server configuration

    Args:
        mcp_name: Exact name of the MCP server from the database
        env_vars: Dictionary of API keys/tokens (required for some MCPs)

    Returns:
        Status message with installation result

    Example:
        install_mcp_server("Github MCP", env_vars={"GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."})
        install_mcp_server("Playwright MCP")  # No credentials needed
    """
    try:
        from tools.installer import MCPInstaller
        from tools.metadata_manager import MetadataManager

        # Load metadata
        metadata_mgr = MetadataManager()

        # Find MCP in database
        mcp_metadata = metadata_mgr.get_mcp(mcp_name)

        if not mcp_metadata:
            # Try to find similar names
            all_mcps = metadata_mgr.list_all()
            similar = [m for m in all_mcps if mcp_name.lower() in m['name'].lower()]

            if similar:
                names = ', '.join([m['name'] for m in similar[:3]])
                return f"MCP '{mcp_name}' not found. Did you mean: {names}?\n\nUse list_all_mcp_servers() to see all available MCPs."
            else:
                return f"MCP '{mcp_name}' not found in database.\n\nUse recommend_mcp_servers('<describe what you need>') to find relevant MCPs."

        # Check for required environment variables
        required_vars = mcp_metadata.get("configuration", {}).get("env_vars", {}).get("required", [])
        missing_vars = []

        for var_spec in required_vars:
            if not env_vars or var_spec["name"] not in env_vars:
                missing_vars.append(var_spec)

        if missing_vars:
            # Return message asking for credentials
            var_list = "\n".join([
                f"  - {var['name']}: {var['description']}\n    Get it at: {var.get('docs_url', 'See documentation')}"
                for var in missing_vars
            ])
            example_name = missing_vars[0]["name"]
            return f"""Required Credentials Missing

Required Credentials:
{var_list}

To install, call:
install_mcp_server("{mcp_metadata['name']}", env_vars={{"{example_name}": "<your-value>"}})
"""

        # Check if already installed
        config_path = Path(".mcp.json")
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
                if mcp_name in config.get("mcpServers", {}):
                    return f"{mcp_metadata['name']} is already installed and configured.\n\nRestart Claude Code to load it if not available."

        # Proceed with installation
        installer = MCPInstaller(
            project_dir=os.getcwd(),
            config_path=".mcp.json"
        )

        result = installer.install_mcp(
            mcp_name=mcp_name,
            metadata=mcp_metadata,
            env_vars=env_vars or {}
        )

        if result.success:
            return f"""Installation Complete: {mcp_metadata['name']}

Configuration Updated:
  - Command: {result.command_path}
  - Args: {' '.join(result.args or [])}
  - Environment variables: {len(result.env_vars or {})} configured

RESTART REQUIRED: Please restart Claude Code to load the new MCP server.

Documentation: {mcp_metadata.get('documentation', 'N/A')}
"""
        else:
            return f"""Installation Failed: {result.error_message}

Documentation: {mcp_metadata.get('documentation', 'N/A')}
"""

    except Exception as e:
        return f"Installation error: {str(e)}"


@mcp.tool()
def get_mcp_installation_status(mcp_name: str) -> str:
    """
    Check installation status and configuration of an MCP server.

    Args:
        mcp_name: Name of the MCP server

    Returns:
        Current installation and configuration status
    """
    try:
        from tools.metadata_manager import MetadataManager

        config_path = Path(".mcp.json")
        if not config_path.exists():
            return "No .mcp.json configuration file found in current directory"

        with open(config_path, 'r') as f:
            config = json.load(f)

        mcp_servers = config.get("mcpServers", {})

        if mcp_name not in mcp_servers:
            # Check if MCP exists in database
            metadata_mgr = MetadataManager()
            mcp_metadata = metadata_mgr.get_mcp(mcp_name)

            if mcp_metadata:
                return f"""{mcp_metadata['name']} is not installed

Available for installation:
  - Description: {mcp_metadata['description']}
  - Primary method: {mcp_metadata.get('installation', {}).get('primary_method', 'unknown')}
  - Documentation: {mcp_metadata.get('documentation', 'N/A')}

Install with: install_mcp_server("{mcp_metadata['name']}")
"""
            else:
                return f"'{mcp_name}' not found in database or .mcp.json configuration"

        mcp_config = mcp_servers[mcp_name]

        return f"""{mcp_name} is installed and configured

Configuration:
  - Type: {mcp_config.get('type', 'N/A')}
  - Command: {mcp_config.get('command', 'N/A')}
  - Args: {' '.join(mcp_config.get('args', []))}
  - Environment variables: {len(mcp_config.get('env', {}))} configured

Status: Ready to use (restart Claude Code if not loaded)
"""

    except Exception as e:
        return f"Error checking status: {str(e)}"


@mcp.tool()
def get_recent_tool_calls(
    limit: int = 10,
    server_name: Optional[str] = None,
    tool_name: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get recent MCP tool calls from the JSON log.

    Args:
        limit: Maximum number of calls to return (default: 10)
        server_name: Filter by MCP server name
        tool_name: Filter by tool name

    Returns:
        List of recent tool call records
    """
    return _storage.get_recent_calls(
        limit=limit,
        server_name=server_name,
        tool_name=tool_name
    )


@mcp.tool()
def search_tool_calls(
    query: str,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Search through logged tool calls.

    Args:
        query: Search string to match in tool name, parameters, or result
        limit: Maximum number of results

    Returns:
        List of matching tool call records
    """
    return _storage.search_calls(query=query, limit=limit)


@mcp.tool()
def get_tool_call_stats() -> Dict[str, Any]:
    """
    Get statistics about logged tool calls.

    Returns:
        Statistics including total calls, calls per server, and calls per tool
    """
    return _storage.get_stats()


if __name__ == "__main__":
    mcp.run()
