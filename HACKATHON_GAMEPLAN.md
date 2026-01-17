# WashedMCP - Hackathon Game Plan

## Project Summary

**Name:** WashedMCP
**Tracks:** Token Optimization + LeanMCP
**Goal:** Reduce AI coding assistant token usage by ~70%
**Method:** Semantic code search + function summaries via MCP

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LeanMCP Server                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tools:                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ index_codebase(path)                                │   │
│  │   → Parses all files                                │   │
│  │   → Extracts functions (tree-sitter)                │   │
│  │   → Generates embeddings (OpenAI)                   │   │
│  │   → Generates summaries (Claude Haiku)              │   │
│  │   → Stores in Chroma                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ search_code(query, top_k=5)                         │   │
│  │   → Embeds query                                    │   │
│  │   → Vector search in Chroma                         │   │
│  │   → Returns results in TOON format                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ get_index_status()                                  │   │
│  │   → Returns indexing progress/stats                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Chroma Vector DB                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Collection: "codebase"                              │   │
│  │                                                     │   │
│  │ Each document:                                      │   │
│  │   - id: unique hash                                 │   │
│  │   - embedding: [1536 floats]                        │   │
│  │   - metadata:                                       │   │
│  │       - function_name: "checkReverse"               │   │
│  │       - file_path: "src/utils.py"                   │   │
│  │       - line_start: 47                              │   │
│  │       - line_end: 55                                │   │
│  │       - language: "python"                          │   │
│  │       - summary: "checks if string is palindrome"   │   │
│  │   - document: (the actual code)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
washedmcp/
├── src/
│   ├── __init__.py
│   ├── parser.py          # tree-sitter function extraction
│   ├── embedder.py        # OpenAI embedding generation
│   ├── summarizer.py      # Claude Haiku summaries
│   ├── database.py        # Chroma operations
│   ├── indexer.py         # orchestrates indexing
│   ├── searcher.py        # search logic
│   ├── toon_formatter.py  # TOON output formatting
│   └── server.py          # LeanMCP server (main entry)
├── tests/
│   ├── test_codebase/     # dummy repo for testing
│   │   ├── utils.py
│   │   ├── auth.py
│   │   └── api.py
│   ├── test_parser.py
│   ├── test_search.py
│   └── test_e2e.py
├── .env                   # API keys
├── requirements.txt
├── pyproject.toml
└── README.md
```

---

## Dependencies

```
# requirements.txt
chromadb>=0.4.0
tree-sitter>=0.20.0
tree-sitter-python>=0.20.0
tree-sitter-javascript>=0.20.0
tree-sitter-typescript>=0.20.0
openai>=1.0.0
anthropic>=0.18.0
leanmcp>=0.3.0
toon-format>=0.1.0
python-dotenv>=1.0.0
```

---

## Environment Variables

```
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
CHROMA_PERSIST_PATH=./.washedmcp/chroma
```

---

## Task Breakdown

### PHASE 1: Core Infrastructure

#### Task 1.1: Project Setup
```
Owner: Anyone
Priority: FIRST

Steps:
1. Create folder structure (see above)
2. Create requirements.txt
3. pip install -r requirements.txt
4. Create .env file with API keys
5. Test imports work

Done when: `python -c "import chromadb, openai, anthropic"` works
```

#### Task 1.2: Parser (tree-sitter)
```
Owner: ___________
Priority: HIGH (blocks everything)

File: src/parser.py

Input: file path
Output: list of functions

Function signature:
    def extract_functions(file_path: str) -> list[dict]

    Returns:
    [
        {
            "name": "checkReverse",
            "code": "def checkReverse(s):\n    return s == s[::-1]",
            "file_path": "/abs/path/to/utils.py",
            "line_start": 47,
            "line_end": 49,
            "language": "python"
        },
        ...
    ]

Languages to support (in order of priority):
1. Python (.py) - MUST HAVE
2. JavaScript (.js) - SHOULD HAVE
3. TypeScript (.ts) - NICE TO HAVE

Steps:
1. Install tree-sitter language parsers
2. Write function to parse single file
3. Extract function/method/class nodes
4. Get name, code, line numbers
5. Test on sample files

Done when: Can extract functions from a .py file correctly
```

#### Task 1.3: Embedder (OpenAI)
```
Owner: ___________
Priority: HIGH (blocks indexing)

File: src/embedder.py

Function signatures:
    def embed_code(code: str) -> list[float]
    def embed_batch(codes: list[str]) -> list[list[float]]
    def embed_query(query: str) -> list[float]

Uses: OpenAI text-embedding-3-small (1536 dimensions)

Steps:
1. Setup OpenAI client
2. Write single embed function
3. Write batch embed function (faster, cheaper)
4. Handle rate limits with retry
5. Test embedding works

Done when: Can embed code and get 1536-dim vector back
```

#### Task 1.4: Summarizer (Claude Haiku)
```
Owner: ___________
Priority: MEDIUM (can skip for MVP)

File: src/summarizer.py

Function signature:
    def summarize_function(code: str, function_name: str) -> str

    Returns: "Checks if a string is a palindrome by comparing with reverse"
    (One line, max 100 chars)

Prompt to use:
    "Summarize what this function does in 10 words or less.
     Be specific about the action, not generic.
     Function: {code}"

Steps:
1. Setup Anthropic client
2. Write summarize function
3. Use claude-3-haiku (cheap & fast)
4. Batch if possible
5. Test summaries are useful

Done when: Can generate 1-line summary for any function
```

#### Task 1.5: Database (Chroma)
```
Owner: ___________
Priority: HIGH

File: src/database.py

Function signatures:
    def init_db(persist_path: str) -> Collection
    def add_functions(collection, functions: list[dict], embeddings: list) -> None
    def search(collection, query_embedding: list[float], top_k: int) -> list[dict]
    def clear_collection(collection) -> None
    def get_stats(collection) -> dict

Steps:
1. Setup Chroma client with persistence
2. Create/get collection
3. Write add function (with metadata)
4. Write search function
5. Test add and retrieve works

Done when: Can store embeddings and search them
```

---

### PHASE 2: Orchestration

#### Task 2.1: Indexer
```
Owner: ___________
Priority: HIGH

File: src/indexer.py

Function signature:
    def index_codebase(path: str, collection) -> dict

    Returns:
    {
        "status": "success",
        "files_processed": 42,
        "functions_indexed": 156,
        "languages": ["python", "javascript"]
    }

Steps:
1. Walk directory tree
2. Filter by extension (.py, .js, .ts)
3. Skip node_modules, .git, __pycache__, etc.
4. For each file:
   a. Parse with tree-sitter
   b. Embed each function
   c. Summarize each function (optional)
   d. Store in Chroma
5. Return stats

Done when: Can index entire folder into Chroma
```

#### Task 2.2: Searcher
```
Owner: ___________
Priority: HIGH

File: src/searcher.py

Function signature:
    def search_code(query: str, collection, top_k: int = 5) -> list[dict]

    Returns:
    [
        {
            "function_name": "checkReverse",
            "file_path": "src/utils.py",
            "line_start": 47,
            "line_end": 49,
            "summary": "checks if string is palindrome",
            "similarity": 0.92
        },
        ...
    ]

Steps:
1. Embed the query
2. Search Chroma
3. Format results
4. Return top_k matches

Done when: Query "palindrome" returns checkReverse function
```

---

### PHASE 3: TOON Integration

#### Task 3.1: TOON Formatter
```
Owner: ___________
Priority: MEDIUM

File: src/toon_formatter.py

Function signature:
    def format_results_toon(results: list[dict]) -> str

JSON output (before):
{
  "results": [
    {"function": "checkReverse", "file": "utils.py", "line": 47, "summary": "..."},
    {"function": "validateEmail", "file": "auth.py", "line": 12, "summary": "..."}
  ]
}

TOON output (after):
results
  function      | file     | line | summary
  checkReverse  | utils.py | 47   | checks if string is palindrome
  validateEmail | auth.py  | 12   | validates email format

Token savings: ~40% on structured output

Steps:
1. pip install toon-format
2. Import and test basic conversion
3. Write formatter function
4. Test output is valid TOON

Done when: Can convert search results to TOON format
```

---

### PHASE 4: MCP Server

#### Task 4.1: LeanMCP Server
```
Owner: ___________
Priority: HIGH

File: src/server.py

Tools to expose:
1. index_codebase
2. search_code
3. get_index_status

Steps:
1. Setup LeanMCP server
2. Define tool schemas
3. Implement tool handlers
4. Test with MCP inspector
5. Test with Claude Code

Done when: Claude Code can call your tools
```

**Tool Definitions:**

```python
# index_codebase
{
    "name": "index_codebase",
    "description": "Index a codebase for semantic search. Run this once when opening a new project.",
    "input_schema": {
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Absolute path to the codebase directory"
            }
        },
        "required": ["path"]
    }
}

# search_code
{
    "name": "search_code",
    "description": "ALWAYS use this FIRST when user asks about code, bugs, functions, or features. Returns exact file locations and summaries. Much faster than searching manually.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Natural language description of what you're looking for"
            },
            "top_k": {
                "type": "integer",
                "description": "Number of results to return (default: 5)",
                "default": 5
            }
        },
        "required": ["query"]
    }
}

# get_index_status
{
    "name": "get_index_status",
    "description": "Check if codebase is indexed and get stats",
    "input_schema": {
        "type": "object",
        "properties": {}
    }
}
```

---

### PHASE 5: Testing

#### Task 5.1: Create Test Codebase
```
Owner: ___________
Priority: MEDIUM

Create: tests/test_codebase/

Files to create:
```

**tests/test_codebase/utils.py:**
```python
def check_reverse(s: str) -> bool:
    """Check if string is palindrome"""
    return s == s[::-1]

def calculate_fibonacci(n: int) -> int:
    """Calculate nth fibonacci number"""
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

def merge_sorted_arrays(arr1: list, arr2: list) -> list:
    """Merge two sorted arrays into one sorted array"""
    result = []
    i = j = 0
    while i < len(arr1) and j < len(arr2):
        if arr1[i] < arr2[j]:
            result.append(arr1[i])
            i += 1
        else:
            result.append(arr2[j])
            j += 1
    result.extend(arr1[i:])
    result.extend(arr2[j:])
    return result
```

**tests/test_codebase/auth.py:**
```python
import re
import hashlib

def validate_email(email: str) -> bool:
    """Check if email format is valid"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Check if password matches hash"""
    return hash_password(password) == hashed

def generate_token(user_id: int) -> str:
    """Generate auth token for user"""
    import secrets
    return f"{user_id}_{secrets.token_hex(16)}"
```

**tests/test_codebase/api.py:**
```python
def fetch_user_data(user_id: int) -> dict:
    """Get user information from database"""
    # Simulated database lookup
    return {"id": user_id, "name": "Test User"}

def update_user_profile(user_id: int, data: dict) -> bool:
    """Update user profile information"""
    # Simulated update
    return True

def delete_user_account(user_id: int) -> bool:
    """Permanently delete user account"""
    # Simulated deletion
    return True

def list_user_posts(user_id: int, limit: int = 10) -> list:
    """Get recent posts by user"""
    return [{"id": i, "title": f"Post {i}"} for i in range(limit)]
```

#### Task 5.2: Test Cases
```
Owner: ___________
Priority: HIGH

Test queries and expected results:

| Query                          | Should Find              |
|--------------------------------|--------------------------|
| "palindrome"                   | check_reverse            |
| "fibonacci"                    | calculate_fibonacci      |
| "merge arrays"                 | merge_sorted_arrays      |
| "email validation"             | validate_email           |
| "password hashing"             | hash_password            |
| "authentication token"         | generate_token           |
| "get user info"                | fetch_user_data          |
| "remove user"                  | delete_user_account      |
| "user's recent posts"          | list_user_posts          |

Create: tests/test_search.py
Run all queries, verify correct function is in top 3 results
```

---

### PHASE 6: Demo

#### Task 6.1: Demo Script
```
Owner: ___________
Priority: HIGH (this wins hackathons)

Demo flow:

1. SHOW THE PROBLEM (30 sec)
   - Open a large codebase
   - Ask Claude: "the palindrome function has a bug"
   - Show Claude searching, reading wrong files
   - Show token count: ~10,000 tokens

2. SHOW THE SOLUTION (30 sec)
   - Run: index_codebase
   - "Indexed 500 functions in 30 seconds"

3. SHOW THE MAGIC (1 min)
   - Same query: "palindrome function has a bug"
   - Instantly: "check_reverse() at utils.py:47"
   - Show token count: ~800 tokens
   - Show: "93% token reduction"

4. SHOW IT WORKS EVERYWHERE (30 sec)
   - Works on Claude Code
   - Works on Codex CLI
   - Works on Gemini CLI
   - "One MCP, all platforms"

5. TECHNICAL DEPTH (30 sec)
   - tree-sitter for parsing
   - OpenAI embeddings for meaning
   - Chroma for vector search
   - TOON format for output optimization
```

#### Task 6.2: Slides (if needed)
```
Slide 1: Problem
- "AI coding assistants waste tokens searching"
- Visual: Claude searching blindly

Slide 2: Solution
- "Semantic index + summaries"
- Visual: Query → Instant result

Slide 3: How it works
- Architecture diagram

Slide 4: Results
- "70% token reduction"
- Before/after comparison

Slide 5: Tech stack
- tree-sitter, OpenAI, Chroma, TOON, LeanMCP
```

---

## Parallel Work Streams

```
PERSON A (Parser + Embedder)         PERSON B (DB + Summarizer)         PERSON C (Server + Demo)
─────────────────────────────        ─────────────────────────────      ─────────────────────────

1.1 Project Setup ◄──────────────────────────── ALL TOGETHER
        │
        ▼
1.2 Parser ──────────────────────►  1.5 Database                        Create test codebase
        │                                  │
        ▼                                  ▼
1.3 Embedder ───────────────────►  1.4 Summarizer                       Slides / demo prep
        │                                  │
        └──────────────┬───────────────────┘
                       ▼
                 2.1 Indexer ◄────────────────── MERGE POINT
                       │
                       ▼
                 2.2 Searcher
                       │
                       ▼
                 3.1 TOON Formatter
                       │
                       ▼
                 4.1 MCP Server ◄──────────────── Person C takes over
                       │
                       ▼
                 5.1-5.2 Testing ◄─────────────── ALL TOGETHER
                       │
                       ▼
                 6.1-6.2 Demo ◄────────────────── ALL TOGETHER
```

---

## Minimum Viable Product (MVP)

If running out of time, cut in this order:

**CUT LAST (must have):**
- Parser (Python only)
- Embedder
- Database
- Searcher
- MCP Server (just search_code)

**CUT SECOND:**
- Summarizer (just return code snippets)
- TOON formatter (just return JSON)
- index_codebase tool (manually index)

**CUT FIRST:**
- Multiple language support
- get_index_status tool
- Fancy error handling

---

## Quick Reference Commands

```bash
# Setup
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Test individual components
python -c "from src.parser import extract_functions; print(extract_functions('test.py'))"
python -c "from src.embedder import embed_code; print(len(embed_code('def foo(): pass')))"
python -c "from src.database import init_db; print(init_db('.test_db'))"

# Run server
python src/server.py

# Test with MCP inspector
npx @modelcontextprotocol/inspector python src/server.py
```

---

## API Keys Needed

| Service | Key | Get it from |
|---------|-----|-------------|
| OpenAI | OPENAI_API_KEY | platform.openai.com |
| Anthropic | ANTHROPIC_API_KEY | console.anthropic.com |

---

## Links

- Chroma: https://docs.trychroma.com/
- tree-sitter Python: https://github.com/tree-sitter/py-tree-sitter
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- TOON Format: https://github.com/toon-format/toon
- LeanMCP: https://github.com/leanmcp/leanmcp

---

## Success Criteria

- [ ] Can index a codebase with 100+ functions
- [ ] Search "palindrome" finds check_reverse function
- [ ] Search returns in <500ms
- [ ] Token reduction is measurable (>50%)
- [ ] Works with Claude Code via MCP
- [ ] Demo runs smoothly

---

**NOW GO BUILD IT**
