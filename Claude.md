# CLAUDE.md — WashedMCP Token Optimization System

This file provides essential context for AI agents working on this project.

---

## Project Overview

**Name**: WashedMCP
**Purpose**: Token-optimized semantic code search MCP server for AI coding assistants
**Core Innovation**: Context expansion via code graph relationships (calls/called_by) + TOON output format

---

## The Problem

When Claude searches a codebase, it gets results but **lacks context to act without additional searches**:
- Multiple back-and-forth tool calls
- Wasted tokens on redundant searches
- Loss of context chain

## The Solution

**Code Graph + Context Expansion** — One search returns:
1. The matched function(s)
2. What they call (`calls`)
3. What calls them (`called_by`)
4. Other functions in the same file
5. All in a token-efficient format (TOON)

---

## Architecture

```
src/
├── parser.py        # Tree-sitter AST parsing + call extraction
├── embedder.py      # Sentence-transformers embeddings (384-dim)
├── database.py      # ChromaDB vector storage + relationships
├── indexer.py       # Codebase indexing orchestration
├── searcher.py      # Semantic search + context expansion
├── summarizer.py    # Function summarization
├── toon_formatter.py # Token-Optimized Object Notation output
├── mcp_server.py    # MCP server (3 tools)
└── cli.py           # CLI interface
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Parsing | tree-sitter (Python, JS, TS, JSX, TSX) |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| Vector DB | ChromaDB (persistent, cosine similarity) |
| MCP | fastmcp |
| Summarization | Google Generative AI (gemini-2.0-flash) |

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `index_codebase` | Index a codebase for semantic search |
| `search_code` | Search with `depth` param for context expansion |
| `get_index_status` | Check if codebase is indexed |

### search_code Parameters

```python
search_code(
    query: str,       # Natural language query
    top_k: int = 5,   # Number of results
    depth: int = 1    # Context expansion depth (1=direct, 2=indirect)
)
```

---

## Key Features

### 1. Function Call Extraction (`parser.py`)
Extracts what functions call during parsing:
```python
def process_user(data):
    validated = validate(data)  # <- CALLS validate
    return save(validated)      # <- CALLS save

# Output: {"calls": ["validate", "save"]}
```

### 2. Reverse Index (`database.py:compute_called_by`)
After indexing, computes who calls each function:
```python
# Forward (from parsing)
process_user -> calls -> [fetch_user, validate]

# Reverse (computed)
validate -> called_by -> [process_user, create_user]
```

### 3. Context Expansion (`database.py:get_function_context`)
```python
get_function_context("validate", depth=1)
# Returns:
# - function: The function itself
# - callees: Functions it calls
# - callers: Functions that call it
# - same_file: Other functions in same file
```

### 4. TOON Format (`toon_formatter.py`)
Token-Optimized Object Notation — saves ~30-40% tokens vs JSON:
```
FOUND: validate() in src/auth.js:42 (82% match)

CODE:
  function validate(data) {
    if (!checkEmail(data.email)) return false;
    ...
  }

CALLS: checkEmail, checkPassword, sanitize
CALLED BY: processUser, createUser
SAME FILE: [sanitize, normalizeInput]
```

---

## Data Model (ChromaDB)

```python
{
    "id": "sha256hash",
    "document": "function code...",
    "embedding": [0.1, 0.2, ...],  # 384-dim
    "metadata": {
        "name": "validate",
        "file_path": "/src/auth.js",
        "line_start": 42,
        "line_end": 48,
        "language": "javascript",
        "summary": "Validates user input data",
        "calls": '["checkEmail", "checkPassword"]',  # JSON string
        "called_by": '["processUser"]',              # Computed after indexing
        "imports": '["./validators"]',
        "exported": true
    }
}
```

---

## Usage

### Installation
```bash
pip install -r requirements.txt
```

### Index a Codebase
```bash
python src/cli.py index /path/to/codebase
```

### Search
```bash
python src/cli.py search "user validation logic"
```

### Run MCP Server
```bash
python src/mcp_server.py
```

### Configure in Claude Code
Add to `.mcp.json`:
```json
{
  "mcpServers": {
    "washedmcp": {
      "command": "python3",
      "args": ["src/mcp_server.py"],
      "env": {}
    }
  }
}
```

---

## Project Structure

```
washedmcp/
├── src/                    # Core Python modules
│   ├── parser.py          # AST parsing + call extraction
│   ├── embedder.py        # Embedding generation
│   ├── database.py        # ChromaDB + relationships
│   ├── indexer.py         # Indexing orchestration
│   ├── searcher.py        # Search + context expansion
│   ├── summarizer.py      # Function summarization
│   ├── toon_formatter.py  # TOON output format
│   ├── mcp_server.py      # MCP server
│   └── cli.py             # CLI interface
├── tests/                  # Test codebase samples
├── docs/                   # Design documents
├── requirements.txt        # Python dependencies
├── .mcp.json              # MCP server config
└── .env.example           # Environment template
```

---

## Development

### Run Tests
Each module has `if __name__ == "__main__":` test code:
```bash
python src/parser.py tests/test_codebase/utils.py
python src/database.py
python src/toon_formatter.py
```

### Environment Variables
```bash
GOOGLE_API_KEY=...  # For summarization (optional)
```

---

## Key Concepts

### Depth Parameter
- `depth=1` (default): Direct callers + callees
- `depth=2`: Callers of callers (for debugging chains)

### Token Efficiency
TOON format is ~30-40% more token-efficient than JSON while remaining human-readable.

---

## Commands Quick Reference

```bash
# Index
python src/cli.py index /path/to/code

# Search
python src/cli.py search "what does X do"

# Check status
python src/cli.py status

# Run MCP server
python src/mcp_server.py
```
