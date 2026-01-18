#!/bin/bash
# WashedMCP One-Line Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/pratham/washedmcp/main/install.sh | bash

set -e

echo "🚀 Installing WashedMCP..."

# Check Python 3.10+
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.10+"
    exit 1
fi

PY_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
PY_MAJOR=$(echo $PY_VERSION | cut -d. -f1)
PY_MINOR=$(echo $PY_VERSION | cut -d. -f2)

if [ "$PY_MAJOR" -lt 3 ] || ([ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 10 ]); then
    echo "❌ Python 3.10+ required. You have Python $PY_VERSION"
    exit 1
fi

echo "✓ Python $PY_VERSION"

# Install washedmcp
echo "📦 Installing washedmcp..."
pip3 install washedmcp --quiet --upgrade

# Check if installed
if ! command -v washedmcp &> /dev/null; then
    echo "❌ Installation failed"
    exit 1
fi

echo "✓ washedmcp installed"

# Add to Claude Code config
CLAUDE_CONFIG="$HOME/.claude.json"

if [ -f "$CLAUDE_CONFIG" ]; then
    echo "⚙️  Adding to Claude Code config..."
    
    # Use Python to safely modify JSON
    python3 << PYEOF
import json
import os

config_path = os.path.expanduser("~/.claude.json")

with open(config_path, 'r') as f:
    config = json.load(f)

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

print("✓ Added to ~/.claude.json")
PYEOF

else
    echo "⚠️  ~/.claude.json not found. Creating..."
    cat > "$CLAUDE_CONFIG" << JSONEOF
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
    echo "✓ Created ~/.claude.json"
fi

echo ""
echo "✅ WashedMCP installed!"
echo ""
echo "📋 Next steps:"
echo "   1. Restart Claude Code"
echo "   2. Use 'index_codebase' to index your project"
echo "   3. Use 'search_code' to search semantically"
echo ""
