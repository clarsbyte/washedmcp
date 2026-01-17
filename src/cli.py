#!/usr/bin/env python3
"""
CLI interface for WashedMCP - can be called from TypeScript MCP server
"""
import sys
import json
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.indexer import index_codebase
from src.searcher import search_code, is_indexed
from src.toon_formatter import format_results


def cmd_index(path: str, skip_summarize: bool = False) -> dict:
    """Index a codebase"""
    try:
        result = index_codebase(path, skip_summarize=skip_summarize)
        return result
    except Exception as e:
        return {"status": "error", "error": str(e)}


def cmd_search(query: str, top_k: int = 5, output_format: str = "toon") -> dict:
    """Search the indexed codebase"""
    try:
        if not is_indexed():
            return {"status": "error", "error": "Codebase not indexed. Run index first."}

        results = search_code(query, top_k=top_k)
        formatted = format_results(results, format=output_format)

        return {
            "status": "success",
            "count": len(results),
            "results": results,
            "formatted": formatted
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


def cmd_status() -> dict:
    """Check indexing status"""
    try:
        indexed = is_indexed()
        if indexed:
            from src.database import init_db, get_stats
            collection = init_db()
            stats = get_stats(collection)
            return {
                "status": "success",
                "indexed": True,
                "total_functions": stats["total_functions"]
            }
        else:
            return {
                "status": "success",
                "indexed": False,
                "total_functions": 0
            }
    except Exception as e:
        return {"status": "error", "error": str(e)}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "No command provided. Use: index, search, or status"}))
        sys.exit(1)

    command = sys.argv[1]

    if command == "index":
        if len(sys.argv) < 3:
            print(json.dumps({"status": "error", "error": "Path required for index command"}))
            sys.exit(1)
        path = sys.argv[2]
        skip_summarize = "--skip-summarize" in sys.argv
        result = cmd_index(path, skip_summarize=skip_summarize)
        print(json.dumps(result))

    elif command == "search":
        if len(sys.argv) < 3:
            print(json.dumps({"status": "error", "error": "Query required for search command"}))
            sys.exit(1)
        query = sys.argv[2]
        top_k = 5
        output_format = "toon"

        for i, arg in enumerate(sys.argv):
            if arg == "--top-k" and i + 1 < len(sys.argv):
                top_k = int(sys.argv[i + 1])
            if arg == "--format" and i + 1 < len(sys.argv):
                output_format = sys.argv[i + 1]

        result = cmd_search(query, top_k=top_k, output_format=output_format)
        print(json.dumps(result))

    elif command == "status":
        result = cmd_status()
        print(json.dumps(result))

    else:
        print(json.dumps({"status": "error", "error": f"Unknown command: {command}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
