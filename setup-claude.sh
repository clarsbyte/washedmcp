#!/bin/bash
# WashedMCP Setup for Claude Code
# Handles: missing Python, old Python, missing pip, broken apt, all major distros

echo "═══════════════════════════════════════════════════════"
echo "       WashedMCP Setup for Claude Code"
echo "═══════════════════════════════════════════════════════"
echo ""

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ -f /etc/os-release ]]; then
        . /etc/os-release
        echo "$ID"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)
echo "Detected OS: $OS"

# Find suitable Python (3.10-3.13)
find_python() {
    for py in python3.12 python3.11 python3.10 python3.13 /usr/bin/python3.12 /usr/bin/python3.11 /usr/bin/python3.10; do
        if command -v $py &> /dev/null; then
            version=$($py -c 'import sys; print(sys.version_info.minor)' 2>/dev/null || echo "0")
            if [ "$version" -ge 10 ] 2>/dev/null && [ "$version" -lt 14 ] 2>/dev/null; then
                command -v $py
                return 0
            fi
        fi
    done
    return 1
}

# Try to fix common apt issues
fix_apt_sources() {
    echo "Checking apt sources..."
    # Remove known problematic source files
    for f in /etc/apt/sources.list.d/*.list; do
        if [ -f "$f" ] && grep -q "Malformed" "$f" 2>/dev/null; then
            echo "Removing broken source: $f"
            sudo rm -f "$f" 2>/dev/null || true
        fi
    done
    # Try to fix any broken sources by testing apt-get update
    if ! sudo apt-get update -qq 2>/dev/null; then
        echo "Attempting to fix apt sources..."
        # Find and remove any sources causing errors
        for f in /etc/apt/sources.list.d/*.list; do
            if [ -f "$f" ]; then
                if ! sudo apt-get update -o Dir::Etc::sourcelist="$f" -o Dir::Etc::sourceparts="-" -qq 2>/dev/null; then
                    echo "Removing problematic source: $f"
                    sudo rm -f "$f" 2>/dev/null || true
                fi
            fi
        done
    fi
}

# Install Python on Ubuntu/Debian
install_python_debian() {
    echo ""
    echo "Installing Python on Ubuntu/Debian..."

    # Fix apt sources first
    fix_apt_sources

    # Try multiple Python versions, newest first
    for pyver in 3.12 3.11 3.10; do
        echo "Trying Python $pyver..."

        # Add deadsnakes PPA if not present
        if ! grep -q "deadsnakes" /etc/apt/sources.list.d/* 2>/dev/null; then
            sudo add-apt-repository -y ppa:deadsnakes/ppa 2>/dev/null || true
            sudo apt-get update -qq 2>/dev/null || true
        fi

        # Try to install (only base package, skip venv/distutils if not available)
        if sudo apt-get install -y python$pyver 2>/dev/null; then
            # Try optional packages but don't fail if missing
            sudo apt-get install -y python$pyver-venv 2>/dev/null || true
            sudo apt-get install -y python$pyver-distutils 2>/dev/null || true

            # Install pip via get-pip.py (most reliable method)
            echo "Installing pip..."
            curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
            sudo python$pyver /tmp/get-pip.py 2>/dev/null || python$pyver /tmp/get-pip.py --user 2>/dev/null || true
            rm -f /tmp/get-pip.py

            if command -v python$pyver &> /dev/null; then
                echo "Python $pyver installed successfully"
                return 0
            fi
        fi
    done

    # Last resort: try system python3 upgrade or install from source
    echo "PPA installation failed, trying alternative methods..."

    # Check if we can use existing python3 with version upgrade
    if command -v python3 &> /dev/null; then
        pyver=$(python3 -c 'import sys; print(sys.version_info.minor)')
        if [ "$pyver" -ge 10 ] 2>/dev/null; then
            return 0
        fi
    fi

    return 1
}

# Install Python on macOS
install_python_macos() {
    echo ""
    echo "Installing Python on macOS..."

    if command -v brew &> /dev/null; then
        brew install python@3.12 2>/dev/null || brew install python@3.11 2>/dev/null || brew install python@3.10 2>/dev/null
    else
        echo "Homebrew not found. Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        brew install python@3.12
    fi
}

# Install Python on Fedora/RHEL
install_python_fedora() {
    echo ""
    echo "Installing Python on Fedora/RHEL..."
    sudo dnf install -y python3.12 python3.12-pip 2>/dev/null || \
    sudo dnf install -y python3.11 python3.11-pip 2>/dev/null || \
    sudo dnf install -y python3.10 python3.10-pip 2>/dev/null || \
    sudo dnf install -y python3 python3-pip 2>/dev/null
}

# Install Python on Arch
install_python_arch() {
    echo ""
    echo "Installing Python on Arch..."
    sudo pacman -Sy --noconfirm python python-pip 2>/dev/null
}

# Main Python installation
install_python() {
    case "$OS" in
        macos)
            install_python_macos
            ;;
        ubuntu|debian|pop|linuxmint|elementary)
            install_python_debian
            ;;
        fedora|rhel|centos|rocky|almalinux)
            install_python_fedora
            ;;
        arch|manjaro|endeavouros)
            install_python_arch
            ;;
        opensuse*)
            sudo zypper install -y python312 python312-pip 2>/dev/null || \
            sudo zypper install -y python311 python311-pip 2>/dev/null || \
            sudo zypper install -y python310 python310-pip 2>/dev/null
            ;;
        *)
            echo "Unsupported OS: $OS"
            echo "Please install Python 3.10+ manually from https://www.python.org/downloads/"
            return 1
            ;;
    esac
}

# Check for Python
PYTHON=$(find_python)

if [ -z "$PYTHON" ]; then
    echo "Python 3.10-3.13 not found."

    if command -v python3 &> /dev/null; then
        current=$(python3 --version 2>&1)
        echo "Current: $current (need 3.10-3.13)"
    fi

    echo ""
    install_python

    # Find Python again after installation
    PYTHON=$(find_python)

    if [ -z "$PYTHON" ]; then
        echo ""
        echo "═══════════════════════════════════════════════════════"
        echo "ERROR: Could not install Python 3.10-3.13"
        echo "═══════════════════════════════════════════════════════"
        echo ""
        echo "Please install manually:"
        case "$OS" in
            ubuntu|debian)
                echo "  sudo apt install python3.11"
                ;;
            fedora)
                echo "  sudo dnf install python3.11"
                ;;
            macos)
                echo "  brew install python@3.11"
                ;;
            *)
                echo "  https://www.python.org/downloads/"
                ;;
        esac
        echo ""
        echo "Then run this script again."
        exit 1
    fi
fi

echo ""
echo "Using: $PYTHON ($($PYTHON --version 2>&1))"

# Ensure pip is available
if ! $PYTHON -m pip --version &> /dev/null 2>&1; then
    echo "Installing pip..."
    curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
    $PYTHON /tmp/get-pip.py --user 2>/dev/null || sudo $PYTHON /tmp/get-pip.py 2>/dev/null || true
    rm -f /tmp/get-pip.py
fi

# Install washedmcp
echo ""
echo "Installing washedmcp..."

# Suppress output, just show result
if $PYTHON -m pip install --user washedmcp -q 2>/dev/null; then
    echo "Installed with pip --user"
elif $PYTHON -m pip install washedmcp -q 2>/dev/null; then
    echo "Installed with pip"
elif sudo $PYTHON -m pip install washedmcp -q 2>/dev/null; then
    echo "Installed with sudo pip"
else
    echo ""
    echo "ERROR: pip install failed. Trying with --break-system-packages..."
    if $PYTHON -m pip install --user --break-system-packages washedmcp 2>/dev/null; then
        echo "Installed with --break-system-packages"
    else
        echo "ERROR: Could not install washedmcp"
        echo "Try manually: $PYTHON -m pip install washedmcp"
        exit 1
    fi
fi

# Configure Claude Code
CLAUDE_CONFIG="$HOME/.claude.json"
PYTHON_PATH="$PYTHON"

echo ""
echo "Configuring Claude Code..."

# Create or update config
if [ -f "$CLAUDE_CONFIG" ]; then
    cp "$CLAUDE_CONFIG" "$CLAUDE_CONFIG.backup"

    if grep -q "washedmcp" "$CLAUDE_CONFIG" 2>/dev/null; then
        echo "washedmcp already configured"
    else
        # Add to existing config
        $PYTHON -c "
import json
config_path = '$CLAUDE_CONFIG'
with open(config_path) as f:
    config = json.load(f)
config.setdefault('mcpServers', {})['washedmcp'] = {
    'command': '$PYTHON_PATH',
    'args': ['-m', 'washedmcp.mcp_server']
}
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)
print('Added to existing config')
" 2>/dev/null || echo "Config update failed, please add manually"
    fi
else
    # Create new config
    mkdir -p "$(dirname "$CLAUDE_CONFIG")"
    cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "washedmcp": {
      "command": "$PYTHON_PATH",
      "args": ["-m", "washedmcp.mcp_server"]
    }
  }
}
EOF
    echo "Created new config"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "            Setup complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Restart Claude Code, then say:"
echo "  'Index this codebase'"
echo ""
