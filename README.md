# WashedMCP -- Token-Optimized Semantic Code Search

An MCP (Model Context Protocol) server that provides **token-efficient semantic code search** with automatic context expansion for AI coding assistants.

## ⚡ Quickest Start (Copy & Paste)

```bash
# Install
pip install washedmcp

# Add to Claude Code config (~/.claude.json)
cat >> ~/.claude.json << 'EOF'
{
  "mcpServers": {
    "washedmcp": {
      "command": "python3",
      "args": ["-m", "washedmcp.mcp_server"]
    }
  }
}
EOF

# Restart Claude Code, then say:
# "Index this codebase and search for authentication"
```

**Or use the setup script:**
```bash
curl -fsSL https://raw.githubusercontent.com/clarsbyte/washedmcp/main/setup-claude.sh | bash
```

---

## The Problem

When AI assistants search codebases, they get isolated results without context:
- Need multiple searches to understand call chains
- Waste tokens on redundant lookups
- Lose context between tool calls

## The Solution

**WashedMCP** returns comprehensive context in a single search:

```
Query: "user validation logic"

FOUND: validate() in src/auth.js:42 (82% match)

CODE:
  function validate(data) {
    if (!checkEmail(data.email)) return false;
    if (!checkPassword(data.password)) return false;
    return sanitize(data);
  }

CALLS: checkEmail, checkPassword, sanitize
CALLED BY: processUser, createUser
SAME FILE: [sanitize, normalizeInput, validateSchema]
```

One search -> full context -> immediate action.

## Features

- **Semantic Search** -- Find code by meaning, not just keywords
- **Context Expansion** -- Automatically include callers/callees
- **Code Graph** -- Track function relationships (calls, called_by)
- **TOON Format** -- Token-Optimized Object Notation (~30-40% fewer tokens than JSON)
- **Multi-Language** -- Python, JavaScript, TypeScript, JSX, TSX

## Requirements

- **Python 3.10-3.13** (Python 3.14+ is not yet supported due to onnxruntime compatibility)
- ~500MB disk space for model and dependencies

## Installation

### One-liner (recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/clarsbyte/washedmcp/main/install.sh | bash
```
Restart Claude Code. Done.

### Using pip
```bash
pip install washedmcp
```

### Using pipx (recommended for macOS)

pipx installs packages in isolated environments, avoiding conflicts with system Python:

```bash
# Install pipx if you don't have it
brew install pipx
pipx ensurepath

# Install washedmcp
pipx install washedmcp
```

### Manual Installation (Virtual Environment)

If you encounter issues with pip or pipx, use a virtual environment:

```bash
# Create a virtual environment
python3 -m venv ~/.washedmcp-venv

# Activate it
source ~/.washedmcp-venv/bin/activate

# Install washedmcp
pip install washedmcp

# The washedmcp command is now available when the venv is activated
```

For permanent access, add an alias to your shell config (`~/.bashrc` or `~/.zshrc`):
```bash
alias washedmcp="~/.washedmcp-venv/bin/washedmcp"
```

### Configure Claude Code

Add to `~/.claude.json`:
```json
{
  "mcpServers": {
    "washedmcp": {
      "command": "washedmcp"
    }
  }
}
```

If using a virtual environment:
```json
{
  "mcpServers": {
    "washedmcp": {
      "command": "/Users/YOUR_USERNAME/.washedmcp-venv/bin/washedmcp"
    }
  }
}
```

Restart Claude Code after configuration.

## Usage

After install, you get 3 tools in Claude Code:

```
# Index your project first
index_codebase("/path/to/your/project")

# Search semantically
search_code("authentication logic")

# Check status
get_index_status()
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `index_codebase` | Index a codebase for semantic search |
| `search_code` | Search with context expansion (`depth` parameter) |
| `get_index_status` | Check if codebase is indexed |
| `get_token_savings` | Show cumulative token savings from TOON vs JSON |

## How It Works

```
+--------------------------------------------------+
|               CONTEXT EXPANSION                   |
+--------------------------------------------------+
|                                                   |
|  Query: "validation failing"                      |
|              |                                    |
|              v                                    |
|  +-----------------------------+                  |
|  |  1. Semantic Search         |                  |
|  |     (embeddings + cosine)   |                  |
|  +-----------------------------+                  |
|              |                                    |
|              v                                    |
|  +-----------------------------+                  |
|  |  2. Context Expansion       |                  |
|  |     - CALLS: [...]          |                  |
|  |     - CALLED BY: [...]      |                  |
|  |     - SAME FILE: [...]      |                  |
|  +-----------------------------+                  |
|              |                                    |
|              v                                    |
|  +-----------------------------+                  |
|  |  3. TOON Output             |                  |
|  |     (token-efficient)       |                  |
|  +-----------------------------+                  |
|                                                   |
+--------------------------------------------------+
```

## Tech Stack

- **Parsing**: tree-sitter (multi-language AST extraction)
- **Embeddings**: sentence-transformers/all-MiniLM-L6-v2
- **Vector DB**: ChromaDB (persistent, cosine similarity)
- **MCP**: fastmcp
- **Summarization**: Google Generative AI (optional)

## Project Structure

```
washedmcp/
+-- washedmcp/            # Python package
|   +-- parser.py         # AST parsing + call extraction
|   +-- embedder.py       # Embedding generation
|   +-- database.py       # ChromaDB + relationships
|   +-- indexer.py        # Indexing orchestration
|   +-- searcher.py       # Search + context expansion
|   +-- toon_formatter.py # TOON output format
|   +-- mcp_server.py     # MCP server entry point
+-- install.sh            # One-line installer
+-- pyproject.toml        # Package config
+-- requirements.txt      # Dependencies
```

## Context Expansion Depth

Control how many hops of relationships to include:

- `depth=1` (default): Direct callers + callees
- `depth=2`: Include callers of callers (for debugging chains)

```python
# MCP tool call
search_code(query="validation", depth=2)
```

WashedMCP also includes a recommendation and auto installation MCP pipeline built with LeanMCP.

It uses tool call interception with hooks and tool call memory to:
- Recommend MCP tools based on repeated assistant behavior
- Auto install and configure MCP tools to remove setup friction
- Reduce repeated lookups by remembering previous tool usage patterns

This turns the MCP tool layer into something that improves over time during longer coding sessions.

## Troubleshooting

### Python Version Issues

**Error: "No matching distribution found for onnxruntime"**

This happens when using Python 3.14+, which doesn't have onnxruntime wheels yet.

**Solution**: Use Python 3.10-3.13

```bash
# macOS (Homebrew)
brew install python@3.12
/opt/homebrew/bin/python3.12 -m pip install washedmcp

# Or use pyenv
pyenv install 3.12
pyenv global 3.12
pip install washedmcp
```

### onnxruntime Installation Fails

**Error: "Could not build wheels for onnxruntime"**

onnxruntime (used by sentence-transformers) requires specific Python versions.

**Solutions**:

1. Use Python 3.10-3.13 (recommended)
2. Install pre-built wheels:
   ```bash
   pip install --only-binary :all: onnxruntime
   pip install washedmcp
   ```

### ChromaDB Issues

**Error: "sqlite3.OperationalError" or ChromaDB errors**

ChromaDB requires SQLite 3.35+. Some older systems have outdated SQLite.

**Solutions**:

1. **macOS**: Update with Homebrew
   ```bash
   brew install sqlite3
   ```

2. **Linux**: Use pysqlite3-binary
   ```bash
   pip install pysqlite3-binary
   ```
   Then add to your shell profile:
   ```bash
   export LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libsqlite3.so.0
   ```

### "externally-managed-environment" Error (macOS/Linux)

Modern Python installations prevent pip from modifying system packages.

**Solution**: Use pipx
```bash
# macOS
brew install pipx
pipx ensurepath
pipx install washedmcp

# Linux
pip install --user pipx
pipx ensurepath
pipx install washedmcp
```

### Command Not Found After Installation

If `washedmcp` isn't found after pip install:

1. Check if it's in your PATH:
   ```bash
   python3 -m site --user-base
   # Add the bin subdirectory to PATH
   export PATH="$HOME/.local/bin:$PATH"
   ```

2. Add to your shell config (`~/.bashrc` or `~/.zshrc`):
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   ```

3. Or use the full path in Claude config:
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

### First Run Is Slow

On first use, washedmcp downloads the embedding model (~100MB). This is a one-time operation. Subsequent runs will be fast.

### Index Not Found

If search returns "codebase not indexed":

1. Run `index_codebase("/path/to/project")` first
2. The index is stored in `<project>/.washedmcp/`
3. Re-index after major code changes

## License

MIT
