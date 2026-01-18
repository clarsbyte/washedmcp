# WashedMCP Context Graph Plan

## What We Have Now
- Tree-sitter parser (Python, JS, TS, JSX, TSX)
- Sentence-transformers embeddings (384-dim)
- ChromaDB vector storage
- MCP server with 3 tools
- Semantic search by meaning

## Problem
Claude gets search results but lacks CONTEXT to act without additional searches.

## Solution: Add Code Graph + Context Expansion

---

## Phase 1: Extract Relationships During Parsing

### 1.1 Extract Function Calls
For each function, capture what it calls:
```python
# Input
def process_user(user_id):
    data = fetch_user(user_id)      # <- CALLS fetch_user
    validated = validate(data)       # <- CALLS validate
    return save_to_db(validated)     # <- CALLS save_to_db

# Output
{
    "name": "process_user",
    "calls": ["fetch_user", "validate", "save_to_db"],
    ...
}
```

### 1.2 Extract Imports
Track what each file imports:
```python
# Input
import React from 'react'
import { useStatusBar } from './hooks/useStatusBar'
import SyncStatus from './SyncStatus'

# Output
{
    "file": "StatusBar.jsx",
    "imports": [
        {"name": "React", "from": "react", "type": "external"},
        {"name": "useStatusBar", "from": "./hooks/useStatusBar", "type": "local"},
        {"name": "SyncStatus", "from": "./SyncStatus", "type": "local"}
    ]
}
```

### 1.3 Extract Exports
Track what each file exports:
```python
# Output
{
    "file": "StatusBar.jsx",
    "exports": ["StatusBar"],
    "default_export": "StatusBar"
}
```

---

## Phase 2: Build Reverse Index (Called-By)

After indexing all files, compute reverse relationships:

```python
# Forward (from parsing)
process_user -> calls -> [fetch_user, validate, save_to_db]

# Reverse (computed)
fetch_user -> called_by -> [process_user, sync_users, admin_panel]
validate -> called_by -> [process_user, create_user, update_user]
```

Store as adjacency list or in ChromaDB metadata.

---

## Phase 3: Context Expansion During Search

### 3.1 Search Flow
```
Query: "why is user validation failing"

1. Semantic search → finds validate() at 82% match

2. Expand context:
   - Get calls: [check_email, check_password, sanitize]
   - Get called_by: [process_user, create_user]
   - Get imports in same file

3. Return context bundle
```

### 3.2 Expansion Depth
- **1-hop**: Direct callers + callees (default)
- **2-hop**: Callers of callers (for debugging)
- Configurable via `depth` parameter

---

## Phase 4: Rich Output Format

### Current Output (weak)
```
FOUND. Read these files directly:
  validate | src/auth.js | 42 | 82%
```

### New Output (strong)
```
FOUND: validate() in src/auth.js:42 (82% match)

CODE:
  function validate(data) {
    if (!checkEmail(data.email)) return false;
    if (!checkPassword(data.password)) return false;
    return sanitize(data);
  }

CALLS: checkEmail, checkPassword, sanitize
CALLED BY: processUser (src/user.js:15), createUser (src/api.js:88)
IMPORTS: { checkEmail, checkPassword } from './validators'
SAME FILE: [sanitize, normalizeInput, validateSchema]

---
Additional matches: src/form-validator.js:22 (65%), ...
```

---

## Implementation Steps

### Step 1: Update Parser (parser.py)
- Add `extract_calls(node)` - find function calls in body
- Add `extract_imports(tree)` - parse import statements
- Add `extract_exports(tree)` - parse export statements
- Return enriched function dict with relationships

### Step 2: Update Database (database.py)
- Store `calls` list in metadata
- After full index, compute and store `called_by`
- Add `get_relationships(func_id)` method

### Step 3: Update Searcher (searcher.py)
- Add `expand_context(results, depth=1)` function
- Fetch callers/callees for top results
- Bundle into single response

### Step 4: Update Formatter (toon_formatter.py)
- New format with CODE + CALLS + CALLED_BY sections
- Include enough context for Claude to act

### Step 5: Update MCP Server (mcp_server.py)
- Add `depth` parameter to search_code
- Return expanded context

---

## Data Model

### Function Record (ChromaDB)
```python
{
    "id": "sha256hash",
    "document": "function code...",
    "embedding": [0.1, 0.2, ...],
    "metadata": {
        "name": "validate",
        "file_path": "/src/auth.js",
        "line_start": 42,
        "line_end": 48,
        "language": "javascript",
        "calls": ["checkEmail", "checkPassword", "sanitize"],
        "called_by": [],  # computed after full index
        "imports": ["./validators"],
        "exported": true
    }
}
```

### File Record (separate collection or JSON)
```python
{
    "file_path": "/src/auth.js",
    "imports": [...],
    "exports": [...],
    "functions": ["validate", "authenticate", "logout"]
}
```

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Extract calls from AST | 2-3 hours |
| Extract imports/exports | 2 hours |
| Compute called_by index | 1 hour |
| Context expansion | 2 hours |
| Rich output format | 1 hour |
| Testing & fixes | 2 hours |
| **Total** | **~10-12 hours** |

---

## References
- [Code Pathfinder](https://github.com/shivasurya/code-pathfinder) - AST + CFG + DFG graphs
- [Code Index MCP](https://github.com/johnhuang316/code-index-mcp) - Dual-tier indexing
- [Sourcegraph](https://docs.sourcegraph.com/code_intelligence) - LSIF/SCIP precise navigation
- [GraphRAG for Code](https://memgraph.com/blog/graphrag-for-devs-coding-assistant) - Graph-based retrieval
