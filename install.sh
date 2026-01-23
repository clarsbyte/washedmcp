#!/bin/bash
# WashedMCP One-Line Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/clarsbyte/washedmcp/main/install.sh | bash

set -e

# Colors for output (if terminal supports it)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

echo ""
echo "${BLUE}=== WashedMCP Installer ===${NC}"
echo ""

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Linux*)  PLATFORM="linux";;
    Darwin*) PLATFORM="macos";;
    *)       PLATFORM="unknown";;
esac

echo "Detected platform: $PLATFORM"

# Check if Python 3 exists
if ! command -v python3 &> /dev/null; then
    echo ""
    echo "${RED}Error: Python 3 not found${NC}"
    echo ""
    if [ "$PLATFORM" = "macos" ]; then
        echo "Install Python using Homebrew:"
        echo "  brew install python@3.12"
    else
        echo "Install Python using your package manager:"
        echo "  Ubuntu/Debian: sudo apt install python3.12"
        echo "  Fedora: sudo dnf install python3.12"
        echo "  Arch: sudo pacman -S python"
    fi
    exit 1
fi

# Get Python version
PY_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
PY_MAJOR=$(echo $PY_VERSION | cut -d. -f1)
PY_MINOR=$(echo $PY_VERSION | cut -d. -f2)

echo "Found Python $PY_VERSION"

# Check Python version is 3.10-3.13
if [ "$PY_MAJOR" -ne 3 ]; then
    echo ""
    echo "${RED}Error: Python 3.10-3.13 required. You have Python $PY_VERSION${NC}"
    exit 1
fi

if [ "$PY_MINOR" -lt 10 ]; then
    echo ""
    echo "${RED}Error: Python 3.10 or newer required. You have Python $PY_VERSION${NC}"
    echo ""
    echo "Please upgrade Python to version 3.10, 3.11, 3.12, or 3.13."
    exit 1
fi

if [ "$PY_MINOR" -gt 13 ]; then
    echo ""
    echo "${RED}Error: Python 3.14+ is not yet supported due to dependency compatibility.${NC}"
    echo "You have Python $PY_VERSION"
    echo ""
    echo "Please use Python 3.10, 3.11, 3.12, or 3.13."
    echo ""
    if [ "$PLATFORM" = "macos" ]; then
        echo "Install a compatible Python version:"
        echo "  brew install python@3.12"
        echo "  # Then use: /opt/homebrew/bin/python3.12 -m pip install washedmcp"
    else
        echo "Install a compatible Python version using pyenv:"
        echo "  pyenv install 3.12"
        echo "  pyenv global 3.12"
    fi
    exit 1
fi

echo "${GREEN}OK${NC} Python version compatible"

# Check for pipx (preferred on macOS)
USE_PIPX=false
if command -v pipx &> /dev/null; then
    USE_PIPX=true
    echo "Found pipx, will use for installation"
fi

# Install washedmcp
echo ""
echo "Installing washedmcp..."

install_with_pip() {
    if python3 -m pip install washedmcp --upgrade 2>&1; then
        return 0
    else
        return 1
    fi
}

install_with_pipx() {
    if pipx install washedmcp --force 2>&1; then
        return 0
    else
        return 1
    fi
}

# Try installation
INSTALL_SUCCESS=false
INSTALL_ERROR=""

if [ "$USE_PIPX" = true ]; then
    echo "Using pipx..."
    if install_with_pipx; then
        INSTALL_SUCCESS=true
    else
        echo "${YELLOW}pipx installation failed, trying pip...${NC}"
        if install_with_pip; then
            INSTALL_SUCCESS=true
        fi
    fi
else
    if install_with_pip; then
        INSTALL_SUCCESS=true
    fi
fi

if [ "$INSTALL_SUCCESS" = false ]; then
    echo ""
    echo "${RED}Installation failed${NC}"
    echo ""
    echo "Common fixes:"
    echo ""
    echo "1. If you see 'onnxruntime' errors:"
    echo "   This usually means your Python version is too new."
    echo "   Use Python 3.10-3.13 instead."
    echo ""
    echo "2. If you see permission errors on macOS:"
    echo "   Install pipx and try again:"
    echo "   brew install pipx"
    echo "   pipx install washedmcp"
    echo ""
    echo "3. If you see 'externally-managed-environment' error:"
    echo "   Use pipx instead of pip:"
    echo "   pip install pipx"
    echo "   pipx install washedmcp"
    echo ""
    echo "4. For manual installation:"
    echo "   python3 -m venv ~/.washedmcp-venv"
    echo "   source ~/.washedmcp-venv/bin/activate"
    echo "   pip install washedmcp"
    echo ""
    exit 1
fi

echo "${GREEN}OK${NC} washedmcp installed"

# Verify installation
echo ""
echo "Verifying installation..."

WASHEDMCP_PATH=""

# Check common locations
if command -v washedmcp &> /dev/null; then
    WASHEDMCP_PATH=$(command -v washedmcp)
elif [ -f "$HOME/.local/bin/washedmcp" ]; then
    WASHEDMCP_PATH="$HOME/.local/bin/washedmcp"
elif [ "$USE_PIPX" = true ]; then
    # pipx might install to a different location
    PIPX_BIN=$(pipx environment --value PIPX_BIN_DIR 2>/dev/null || echo "$HOME/.local/bin")
    if [ -f "$PIPX_BIN/washedmcp" ]; then
        WASHEDMCP_PATH="$PIPX_BIN/washedmcp"
    fi
fi

if [ -z "$WASHEDMCP_PATH" ]; then
    echo "${YELLOW}Warning: washedmcp command not found in PATH${NC}"
    echo ""
    echo "The package was installed but the command may not be in your PATH."
    echo "Try adding ~/.local/bin to your PATH:"
    echo ""
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "Add this line to your ~/.bashrc or ~/.zshrc"
    WASHEDMCP_PATH="washedmcp"
fi

echo "${GREEN}OK${NC} washedmcp verified at: $WASHEDMCP_PATH"

# Configure Claude Code
CLAUDE_CONFIG="$HOME/.claude.json"

echo ""
echo "Configuring Claude Code..."

if [ -f "$CLAUDE_CONFIG" ]; then
    # Use Python to safely modify JSON
    python3 << PYEOF
import json
import os
import sys

config_path = os.path.expanduser("~/.claude.json")

try:
    with open(config_path, 'r') as f:
        config = json.load(f)
except json.JSONDecodeError:
    print("Warning: ~/.claude.json is invalid JSON, creating backup and new config")
    import shutil
    shutil.copy(config_path, config_path + ".backup")
    config = {}

# Ensure mcpServers exists
if 'mcpServers' not in config:
    config['mcpServers'] = {}

# Add washedmcp
config['mcpServers']['washedmcp'] = {
    "type": "stdio",
    "command": "washedmcp",
    "args": []
}

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("Updated ~/.claude.json")
PYEOF

else
    echo "Creating ~/.claude.json..."
    cat > "$CLAUDE_CONFIG" << 'JSONEOF'
{
  "mcpServers": {
    "washedmcp": {
      "type": "stdio",
      "command": "washedmcp",
      "args": []
    }
  }
}
JSONEOF
    echo "Created ~/.claude.json"
fi

echo "${GREEN}OK${NC} Claude Code configured"

# Success message
echo ""
echo "${GREEN}=== Installation Complete ===${NC}"
echo ""
echo "Next steps:"
echo "  1. Restart Claude Code (or run: claude --mcp-restart)"
echo "  2. In Claude Code, use: index_codebase(\"/path/to/your/project\")"
echo "  3. Then search with: search_code(\"your query\")"
echo ""
echo "For help, visit: https://github.com/clarsbyte/washedmcp"
echo ""
