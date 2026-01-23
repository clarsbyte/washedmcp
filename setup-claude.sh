#!/bin/bash
# WashedMCP Quick Setup for Claude Code
# Usage: curl -fsSL https://raw.githubusercontent.com/clarsbyte/washedmcp/main/setup-claude.sh | bash

set -e

echo "═══════════════════════════════════════════════════════"
echo "       WashedMCP Setup for Claude Code"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
check_python() {
    for py in python3.12 python3.11 python3.10 python3.13 python3; do
        if command -v $py &> /dev/null; then
            version=$($py -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
            major=$(echo $version | cut -d. -f1)
            minor=$(echo $version | cut -d. -f2)

            if [ "$major" -eq 3 ] && [ "$minor" -ge 10 ] && [ "$minor" -lt 14 ]; then
                echo $py
                return 0
            fi
        fi
    done
    return 1
}

PYTHON=$(check_python)
if [ -z "$PYTHON" ]; then
    echo -e "${RED}❌ Error: Python 3.10-3.13 required${NC}"
    echo ""
    echo "Install Python 3.12:"
    echo "  macOS:  brew install python@3.12"
    echo "  Ubuntu: sudo apt install python3.12"
    exit 1
fi

echo -e "${GREEN}✓ Found Python: $PYTHON${NC}"

# Install washedmcp
echo ""
echo "Installing washedmcp..."

if command -v pipx &> /dev/null; then
    pipx install washedmcp 2>/dev/null || pipx upgrade washedmcp 2>/dev/null || true
    WASHEDMCP_PATH=$(which washedmcp 2>/dev/null || echo "washedmcp")
elif $PYTHON -m pip --version &> /dev/null; then
    $PYTHON -m pip install --user washedmcp --quiet --upgrade
    WASHEDMCP_PATH="$PYTHON -m washedmcp.mcp_server"
else
    echo -e "${RED}❌ Error: pip not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ washedmcp installed${NC}"

# Configure Claude Code
CLAUDE_CONFIG="$HOME/.claude.json"

echo ""
echo "Configuring Claude Code..."

# Create or update config
if [ -f "$CLAUDE_CONFIG" ]; then
    # Backup existing config
    cp "$CLAUDE_CONFIG" "$CLAUDE_CONFIG.backup"

    # Check if washedmcp already configured
    if grep -q "washedmcp" "$CLAUDE_CONFIG"; then
        echo -e "${YELLOW}⚠ washedmcp already in config, skipping${NC}"
    else
        # Add washedmcp to existing config using Python
        $PYTHON << EOF
import json

with open("$CLAUDE_CONFIG", "r") as f:
    config = json.load(f)

if "mcpServers" not in config:
    config["mcpServers"] = {}

config["mcpServers"]["washedmcp"] = {
    "command": "python3",
    "args": ["-m", "washedmcp.mcp_server"]
}

with open("$CLAUDE_CONFIG", "w") as f:
    json.dump(config, f, indent=2)

print("Config updated")
EOF
        echo -e "${GREEN}✓ Added to existing Claude config${NC}"
    fi
else
    # Create new config
    cat > "$CLAUDE_CONFIG" << 'EOF'
{
  "mcpServers": {
    "washedmcp": {
      "command": "python3",
      "args": ["-m", "washedmcp.mcp_server"]
    }
  }
}
EOF
    echo -e "${GREEN}✓ Created Claude config${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Restart Claude Code"
echo "  2. Say: 'Index this codebase'"
echo "  3. Say: 'Search for authentication logic'"
echo ""
echo "CLI commands:"
echo "  washedmcp index /path/to/code"
echo "  washedmcp search 'your query'"
echo "  washedmcp stats"
echo ""
