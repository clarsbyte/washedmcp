# WashedMCP - Semantic Code Search

A Model Context Protocol (MCP) server that provides semantic code search for your projects. Search your codebase by meaning, not just by name.

## Features

- **Semantic Search**: Find code by describing what it does, not just its name
- **Multi-Language Support**: Python, JavaScript, TypeScript, JSX, TSX
- **Local Processing**: All embedding and search runs locally - no API keys needed
- **Context Expansion**: Automatically discovers related functions (callers, callees, same-file)
- **Fast**: Uses vector embeddings for sub-second search across large codebases

## Installation

```bash
pip install washedmcp
```

## Usage with Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "washedmcp": {
      "command": "washedmcp"
    }
  }
}
```

Or if running from source:

```json
{
  "mcpServers": {
    "washedmcp": {
      "command": "python3",
      "args": ["src/mcp_server.py"],
      "cwd": "/path/to/washedmcp"
    }
  }
}
```

## Available Tools

### `index_codebase`
Index a project for semantic search. Run once per project.

```
index_codebase(path="/path/to/your/project")
```

The index is stored in `<project>/.washedmcp/` so each project has its own index.

### `search_code`
Search for code by meaning. Returns matching functions with similarity scores.

```
search_code(query="function that validates user input", top_k=5, depth=1)
```

- `query`: Natural language description of what you're looking for
- `top_k`: Number of results (default: 5)
- `depth`: Context expansion (1=direct relationships, 2=indirect)

### `get_index_status`
Check if the current project is indexed.

## First Run

On first use, the embedding model (~100MB) will be downloaded. This is a one-time operation.

## Requirements

- Python 3.10-3.13 (Python 3.14+ is not yet supported due to onnxruntime compatibility)
- ~500MB disk space for model and dependencies
