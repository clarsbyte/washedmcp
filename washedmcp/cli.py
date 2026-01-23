#!/usr/bin/env python3
"""
CLI interface for WashedMCP
"""
import sys
import json

from .indexer import index_codebase
from .searcher import search_code, is_indexed
from .toon_formatter import format_results
from .logging_config import get_logger

logger = get_logger(__name__)


def cmd_index(path: str, skip_summarize: bool = False) -> dict:
    """Index a codebase"""
    logger.info("Indexing codebase at: %s", path)
    try:
        result = index_codebase(path, skip_summarize=skip_summarize)
        logger.info("Index complete: %s", result.get("status"))
        return result
    except Exception as e:
        logger.exception("Error indexing codebase")
        return {"status": "error", "error": str(e)}


def cmd_search(query: str, top_k: int = 5, output_format: str = "toon") -> dict:
    """Search the indexed codebase"""
    logger.info("Searching for: '%s' (top_k=%d, format=%s)", query, top_k, output_format)
    try:
        if not is_indexed():
            logger.warning("Search attempted but codebase is not indexed")
            return {"status": "error", "error": "Codebase not indexed. Run index first."}

        results = search_code(query, top_k=top_k)
        formatted = format_results(results, format=output_format)

        logger.info("Search found %d results", len(results))
        return {
            "status": "success",
            "count": len(results),
            "results": results,
            "formatted": formatted
        }
    except Exception as e:
        logger.exception("Error during search")
        return {"status": "error", "error": str(e)}


def cmd_status() -> dict:
    """Check indexing status"""
    logger.debug("Checking index status")
    try:
        indexed = is_indexed()
        if indexed:
            from .database import get_stats
            stats = get_stats()
            logger.info("Index status: indexed with %d functions", stats["total_functions"])
            return {
                "status": "success",
                "indexed": True,
                "total_functions": stats["total_functions"]
            }
        else:
            logger.info("Index status: not indexed")
            return {
                "status": "success",
                "indexed": False,
                "total_functions": 0
            }
    except Exception as e:
        logger.exception("Error checking index status")
        return {"status": "error", "error": str(e)}


def cmd_stats(reset: bool = False, as_json: bool = False) -> dict:
    """Show token savings statistics"""
    logger.debug("Getting token savings stats (reset=%s, json=%s)", reset, as_json)
    try:
        from .stats import get_token_savings_summary, get_token_stats, reset_stats

        if reset:
            reset_stats()
            logger.info("Token statistics reset")
            return {"status": "success", "message": "Statistics reset"}

        if as_json:
            stats = get_token_stats()
            return {"status": "success", "stats": stats}
        else:
            summary = get_token_savings_summary()
            return {"status": "success", "summary": summary}
    except Exception as e:
        logger.exception("Error getting stats")
        return {"status": "error", "error": str(e)}


def main():
    logger.debug("CLI started with arguments: %s", sys.argv)

    if len(sys.argv) < 2:
        logger.error("No command provided")
        print(json.dumps({"status": "error", "error": "No command provided. Use: index, search, status, or stats"}))
        sys.exit(1)

    command = sys.argv[1]
    logger.debug("Command: %s", command)

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

    elif command == "stats":
        reset = "--reset" in sys.argv
        as_json = "--json" in sys.argv

        result = cmd_stats(reset=reset, as_json=as_json)

        if as_json or reset:
            print(json.dumps(result))
        else:
            # Print the summary directly (human-readable)
            print(result.get("summary", json.dumps(result)))

    else:
        print(json.dumps({"status": "error", "error": f"Unknown command: {command}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
