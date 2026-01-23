#!/bin/bash
# WashedMCP Quick Setup for Claude Code
# Usage: curl -fsSL https://raw.githubusercontent.com/clarsbyte/washedmcp/main/setup-claude.sh | bash

echo "═══════════════════════════════════════════════════════"
echo "       WashedMCP Setup for Claude Code"
echo "═══════════════════════════════════════════════════════"
echo ""

# Find Python 3.10-3.13
PYTHON=""
for py in python3.12 python3.11 python3.10 python3.13 python3; do
    if command -v $py &> /dev/null; then
        version=$($py -c 'import sys; print(sys.version_info.minor)' 2>/dev/null)
        if [ -n "$version" ] && [ "$version" -ge 10 ] && [ "$version" -lt 14 ]; then
            PYTHON=$py
            break
        fi
    fi
done

if [ -z "$PYTHON" ]; then
    echo "ERROR: Python 3.10-3.13 required"
    echo ""
    echo "Install Python 3.12:"
    echo "  macOS:  brew install python@3.12"
    echo "  Ubuntu: sudo apt install python3.12"
    exit 1
fi

echo "Found Python: $PYTHON"

# Install washedmcp
echo ""
echo "Installing washedmcp..."

if command -v pipx &> /dev/null; then
    echo "Using pipx..."
    pipx install washedmcp 2>&1 || pipx upgrade washedmcp 2>&1 || true
else
    echo "Using pip..."
    $PYTHON -m pip install --user washedmcp --upgrade 2>&1
fi

echo "washedmcp installed"

# Configure Claude Code
CLAUDE_CONFIG="$HOME/.claude.json"

echo ""
echo "Configuring Claude Code..."

if [ -f "$CLAUDE_CONFIG" ]; then
    cp "$CLAUDE_CONFIG" "$CLAUDE_CONFIG.backup"

    if grep -q "washedmcp" "$CLAUDE_CONFIG"; then
        echo "washedmcp already in config, skipping"
    else
        # Add washedmcp to existing config
        $PYTHON << 'PYEOF'
import json
import os

config_path = os.path.expanduser("~/.claude.json")
with open(config_path, "r") as f:
    config = json.load(f)

if "mcpServers" not in config:
    config["mcpServers"] = {}

config["mcpServers"]["washedmcp"] = {
    "command": "python3",
    "args": ["-m", "washedmcp.mcp_server"]
}

with open(config_path, "w") as f:
    json.dump(config, f, indent=2)

print("Added to existing Claude config")
PYEOF
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
    echo "Created Claude config"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "Setup complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Restart Claude Code"
echo "  2. Say: 'Index this codebase'"
echo "  3. Say: 'Search for authentication logic'"
echo ""
