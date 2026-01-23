#!/usr/bin/env python3
"""
WashedMCP - Semantic Code Search MCP Server
Uses official MCP SDK. Runs 100% locally.

Features:
- Async indexing with progress reporting
- Background job support for long-running operations
- Cancellation support
- Non-blocking embedding generation
"""

import sys
import os
import asyncio

# Python version check
if sys.version_info < (3, 10):
    sys.exit("WashedMCP requires Python 3.10 or higher. You have Python {}.{}.".format(
        sys.version_info.major, sys.version_info.minor
    ))

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from .logging_config import get_logger
from .security import (
    sanitize_path,
    validate_query,
    SecurityError,
    InputValidationError,
    MAX_QUERY_LENGTH,
)

logger = get_logger(__name__)

# Create server
server = Server("washedmcp")

# Track the currently indexed project path
_indexed_project_path = None

# Default timeout for indexing operations (10 minutes)
DEFAULT_INDEX_TIMEOUT = 600.0


@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="index_codebase",
            description="Index a codebase for semantic search. Run once per project.",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path to codebase"},
                    "background": {
                        "type": "boolean",
                        "description": "Run in background (returns job_id for polling). Default: false for small codebases, recommended for large ones.",
                        "default": False
                    },
                    "timeout": {
                        "type": "number",
                        "description": "Timeout in seconds for synchronous indexing. Default: 600 (10 minutes)",
                        "default": 600
                    }
                },
                "required": ["path"]
            }
        ),
        Tool(
            name="search_code",
            description="ALWAYS use FIRST when user asks about code/bugs/functions. Finds by MEANING not name.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "What to search for"},
                    "top_k": {"type": "integer", "description": "Results count", "default": 5},
                    "depth": {"type": "integer", "description": "Context expansion depth (1=direct, 2=indirect)", "default": 1}
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_index_status",
            description="Check if codebase is indexed.",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="get_token_savings",
            description="Show cumulative token savings from using TOON format vs JSON across all searches.",
            inputSchema={
                "type": "object",
                "properties": {
                    "reset": {
                        "type": "boolean",
                        "description": "Reset all statistics",
                        "default": False
                    }
                }
            }
        )
    ]


async def _index_foreground(path: str, timeout: float) -> str:
    """
    Run indexing in the foreground with async support.

    Returns formatted result text.
    """
    global _indexed_project_path

    from .async_indexer import index_codebase_async

    _indexed_project_path = os.path.abspath(path)

    try:
        res = await asyncio.wait_for(
            index_codebase_async(path, skip_summarize=True),
            timeout=timeout
        )

        if res["status"] == "success":
            return f"Indexed {res['functions_indexed']} functions from {res['files_processed']} files"
        else:
            return f"Error: {res.get('error', 'Unknown')}"

    except asyncio.TimeoutError:
        return f"Error: Indexing timed out after {timeout} seconds. Consider using background=true for large codebases."
    except asyncio.CancelledError:
        return "Error: Indexing was cancelled"
    except Exception as e:
        return f"Error: {e}"


async def _index_background(path: str) -> str:
    """
    Submit indexing as a background job.

    Returns job submission result text.
    """
    global _indexed_project_path

    from .background import submit_index_job, get_active_indexing

    # Check if there's already an active indexing job
    active = await get_active_indexing()
    if active:
        return (
            f"Indexing already in progress.\n"
            f"Job ID: {active['job_id']}\n"
            f"Status: {active['status']}\n"
            f"Progress: {active['progress']*100:.1f}%\n"
            f"Phase: {active['phase']}\n"
            f"Use get_index_status to check progress."
        )

    _indexed_project_path = os.path.abspath(path)

    job_id = await submit_index_job(path, skip_summarize=True)

    return (
        f"Background indexing started.\n"
        f"Job ID: {job_id}\n"
        f"Use get_index_status to check progress."
    )


async def _get_index_status_text() -> str:
    """Get formatted index status text."""
    from .searcher import is_indexed
    from .database import get_stats
    from .background import get_active_indexing

    # First check for active background job
    active_job = await get_active_indexing()
    if active_job:
        lines = [
            f"Indexing in progress:",
            f"  Job ID: {active_job['job_id']}",
            f"  Phase: {active_job['phase']}",
            f"  Progress: {active_job['progress']*100:.1f}%",
            f"  Files: {active_job['files_processed']}/{active_job['total_files']}",
            f"  Functions found: {active_job['functions_found']}",
        ]
        if active_job['current_file']:
            # Truncate long file paths
            current = active_job['current_file']
            if len(current) > 50:
                current = "..." + current[-47:]
            lines.append(f"  Current: {current}")
        lines.append(f"  Elapsed: {active_job['elapsed_seconds']}s")
        return "\n".join(lines)

    # Check if we have a completed index
    if is_indexed(project_path=_indexed_project_path):
        stats = get_stats()
        return f"Indexed: {stats['total_functions']} functions"
    else:
        return "Not indexed"


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    global _indexed_project_path

    logger.debug("Tool called: %s with arguments: %s", name, arguments)

    try:
        if name == "index_codebase":
            path = arguments.get("path")
            if not path:
                return [TextContent(type="text", text="Error: path required")]

            # Validate and sanitize the path
            try:
                path = sanitize_path(path)
            except SecurityError as e:
                return [TextContent(type="text", text=f"Error: Invalid path - {e}")]

            background = arguments.get("background", False)
            timeout = arguments.get("timeout", DEFAULT_INDEX_TIMEOUT)

            # Validate timeout
            if not isinstance(timeout, (int, float)) or timeout <= 0:
                timeout = DEFAULT_INDEX_TIMEOUT
            elif timeout > 3600:  # Max 1 hour
                timeout = 3600

            if background:
                text = await _index_background(path)
            else:
                text = await _index_foreground(path, timeout)

        elif name == "search_code":
            # Lazy imports
            from .searcher import search_code_with_context, is_indexed
            from .toon_formatter import format_results_rich

            query = arguments.get("query")
            if not query:
                return [TextContent(type="text", text="Error: query required")]

            # Validate and sanitize the query
            try:
                query = validate_query(query, MAX_QUERY_LENGTH)
            except InputValidationError as e:
                return [TextContent(type="text", text=f"Error: Invalid query - {e}")]

            if not is_indexed(project_path=_indexed_project_path):
                # Check if indexing is in progress
                from .background import get_active_indexing
                active = await get_active_indexing()
                if active:
                    text = (
                        f"Indexing in progress ({active['progress']*100:.1f}%). "
                        f"Please wait for indexing to complete."
                    )
                else:
                    text = "Not indexed. Run index_codebase first."
            else:
                # Validate and sanitize depth parameter
                depth = arguments.get("depth", 1)
                if not isinstance(depth, int) or depth < 0:
                    depth = 1
                elif depth > 3:  # Limit max depth to prevent performance issues
                    depth = 3

                # Validate and sanitize top_k parameter
                top_k = arguments.get("top_k", 5)
                if not isinstance(top_k, int) or top_k < 1:
                    top_k = 5
                elif top_k > 50:  # Limit max results
                    top_k = 50

                # Run search in thread pool to avoid blocking
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None,
                    lambda: search_code_with_context(
                        query,
                        top_k=top_k,
                        depth=depth,
                        project_path=_indexed_project_path
                    )
                )

                if result["results"]:
                    text = format_results_rich(result["results"], result["context"])
                else:
                    text = "No results."

        elif name == "get_index_status":
            text = await _get_index_status_text()

        elif name == "get_token_savings":
            from .stats import get_token_savings_summary, reset_stats

            if arguments.get("reset", False):
                reset_stats()
                text = "Token savings statistics have been reset."
            else:
                text = get_token_savings_summary()

        else:
            text = f"Unknown tool: {name}"

        return [TextContent(type="text", text=text)]

    except Exception as e:
        logger.exception("Error in tool %s", name)
        return [TextContent(type="text", text=f"Error: {e}")]


async def _async_main():
    logger.info("Starting WashedMCP server")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


def main():
    """Entry point for the washedmcp CLI command."""
    logger.info("WashedMCP MCP server starting...")
    asyncio.run(_async_main())


if __name__ == "__main__":
    main()
