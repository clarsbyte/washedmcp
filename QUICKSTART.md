# WashedMCP Quick Start

## 🚀 Fastest Setup (30 seconds)

### Step 1: Install
```bash
pip install washedmcp
```

### Step 2: Add to Claude Code
Add to `~/.claude.json`:
```json
{
  "mcpServers": {
    "washedmcp": {
      "command": "python3",
      "args": ["-m", "washedmcp.mcp_server"]
    }
  }
}
```

### Step 3: Restart Claude Code
```bash
claude  # or restart your Claude Code window
```

### Step 4: Use It!
In Claude Code, just say:
```
Index this codebase and search for "authentication logic"
```

That's it! 🎉

---

## 📦 Alternative: Docker (Zero Dependencies)

```bash
# Run WashedMCP in Docker
docker run -d \
  --name washedmcp \
  -v $(pwd):/codebase:ro \
  -p 8080:8080 \
  ghcr.io/clarsbyte/washedmcp:latest

# Add to ~/.claude.json
{
  "mcpServers": {
    "washedmcp": {
      "command": "curl",
      "args": ["-s", "http://localhost:8080"]
    }
  }
}
```

---

## 🛠 CLI Commands

```bash
# Index a codebase
washedmcp index /path/to/project

# Search
washedmcp search "user authentication"

# Check status
washedmcp status

# View token savings
washedmcp stats
```

---

## 📊 Token Savings

Every search saves ~35% tokens compared to JSON output:

```bash
washedmcp stats
```

```
═══════════════════════════════════════════════════════
           WashedMCP Token Savings Statistics
═══════════════════════════════════════════════════════

  Total Searches:           1,247
  Tokens saved (est):       227,388
  Average Savings:          37.01%

═══════════════════════════════════════════════════════
```

---

## ⚠️ Troubleshooting

**Python 3.14 error?**
```bash
brew install python@3.12
/opt/homebrew/bin/python3.12 -m pip install washedmcp
```

**"externally-managed-environment" error?**
```bash
pipx install washedmcp
```

**Command not found?**
```bash
export PATH="$HOME/.local/bin:$PATH"
```

---

## 📚 Full Documentation

See [README.md](README.md) for complete documentation.
