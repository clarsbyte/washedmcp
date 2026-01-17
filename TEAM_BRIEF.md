# WashedMCP - Token Optimization Tool

## The Problem

When you ask Claude Code something like "the palindrome function has a bug" in a big codebase, Claude:
1. Searches for "palindrome"
2. Doesn't find it (because it's named `checkReverse`)
3. Tries other searches
4. Reads wrong files
5. **Wastes 10,000+ tokens just finding the right code**

## Our Solution

We build a smart index of the codebase that understands what code DOES, not just what it's named.

```
"palindrome function has a bug"
         ↓
    [Our Tool]
         ↓
"checkReverse() at src/utils.py:47 - checks if string is palindrome"
         ↓
Claude goes directly there. Done.
```

## How It Works

### Step 1: Index (one time setup)
- Scan all files in codebase
- Extract every function using tree-sitter (code parser)
- For each function:
  - Create an "embedding" (vector that captures meaning)
  - Generate a 1-line summary
- Store in Chroma (vector database)

### Step 2: Search (every query)
- User asks about "palindrome"
- We convert that to an embedding
- Find functions with similar meaning (not similar name)
- Return: file, line number, summary

## Tech Stack

| Component | Tool |
|-----------|------|
| Code parsing | tree-sitter (Python) |
| Embeddings | OpenAI text-embedding-3-small |
| Summaries | Claude Haiku (cheap & fast) |
| Vector DB | Chroma |
| Interface | MCP Server |

## Expected Token Savings

- Semantic search (finds right code): ~60% savings
- Summaries (sends less code): ~30% savings
- **Total: ~70% token reduction**

## Task Split

| Task | Description |
|------|-------------|
| **Parser** | Use tree-sitter to extract functions from Python/JS/TS files |
| **Embedder** | Connect to OpenAI API, generate embeddings for code |
| **Summarizer** | Connect to Claude Haiku, generate 1-line descriptions |
| **Database** | Setup Chroma, store embeddings, implement search |
| **CLI** | `washedmcp init` and `washedmcp search` commands |
| **MCP Server** | Expose search_code tool to Claude Code |
| **Demo** | Show before/after token comparison |

## Build Order

```
Parser → Embedder → Database → CLI → MCP Server → Demo
              ↘                  ↗
            Summarizer
```

Parser and Embedder can be built in parallel with Summarizer.

## Minimum Viable Demo

Must have:
- Parser extracts functions
- Embeddings + search works
- Can show: "query X finds function Y"

Nice to have:
- Summaries
- MCP integration
- TOON format for extra token savings

## Links

- Chroma docs: https://docs.trychroma.com/
- tree-sitter Python: https://github.com/tree-sitter/py-tree-sitter
- OpenAI embeddings: https://platform.openai.com/docs/guides/embeddings
- Similar project (reference): https://github.com/zilliztech/claude-context
