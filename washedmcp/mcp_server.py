#!/usr/bin/env python3
"""
WashedMCP - Semantic Code Search MCP Server
Uses official MCP SDK. Runs 100% locally.
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

# Create server
server = Server("washedmcp")

# Track the currently indexed project path
_indexed_project_path = None


@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="index_codebase",
            description="Index a codebase for semantic search. Run once per project.",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Path to codebase"}
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
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    global _indexed_project_path

    try:
        # Lazy imports (relative)
        from .indexer import index_codebase
        from .searcher import search_code_with_context, is_indexed
        from .toon_formatter import format_results_rich

        if name == "index_codebase":
            path = arguments.get("path")
            if not path:
                return [TextContent(type="text", text="Error: path required")]

            # Store the project path for later searches
            _indexed_project_path = os.path.abspath(path)

            res = index_codebase(path, skip_summarize=True)
            if res["status"] == "success":
                text = f"Indexed {res['functions_indexed']} functions from {res['files_processed']} files"
            else:
                text = f"Error: {res.get('error', 'Unknown')}"

        elif name == "search_code":
            query = arguments.get("query")
            if not query:
                return [TextContent(type="text", text="Error: query required")]

            if not is_indexed(project_path=_indexed_project_path):
                text = "Not indexed. Run index_codebase first."
            else:
                depth = arguments.get("depth", 1)
                result = search_code_with_context(
                    query,
                    top_k=arguments.get("top_k", 5),
                    depth=depth,
                    project_path=_indexed_project_path
                )
                if result["results"]:
                    text = format_results_rich(result["results"], result["context"])
                else:
                    text = "No results."

        elif name == "get_index_status":
            if is_indexed(project_path=_indexed_project_path):
                from .database import get_stats
                stats = get_stats()
                text = f"Indexed: {stats['total_functions']} functions"
            else:
                text = "Not indexed"
        else:
            text = f"Unknown tool: {name}"

        return [TextContent(type="text", text=text)]

    except Exception as e:
        return [TextContent(type="text", text=f"Error: {e}")]


async def _async_main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


def main():
    """Entry point for the washedmcp CLI command."""
    asyncio.run(_async_main())


if __name__ == "__main__":
    main()
