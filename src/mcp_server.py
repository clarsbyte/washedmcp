#!/usr/bin/env python3
"""
WashedMCP - Semantic Code Search MCP Server
Uses official MCP SDK. Runs 100% locally.
"""

import sys
import os
import asyncio

# Add parent to path BEFORE importing mcp
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Create server
server = Server("washedmcp")


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
    try:
        # Lazy imports
        from src.indexer import index_codebase
        from src.searcher import search_code, search_code_with_context, is_indexed
        from src.toon_formatter import format_results

        if name == "index_codebase":
            path = arguments.get("path")
            if not path:
                return [TextContent(type="text", text="Error: path required")]

            res = index_codebase(path, skip_summarize=True)
            if res["status"] == "success":
                text = f"Indexed {res['functions_indexed']} functions from {res['files_processed']} files"
            else:
                text = f"Error: {res.get('error', 'Unknown')}"

        elif name == "search_code":
            query = arguments.get("query")
            if not query:
                return [TextContent(type="text", text="Error: query required")]

            if not is_indexed():
                text = "Not indexed. Run index_codebase first."
            else:
                depth = arguments.get("depth", 1)
                result = search_code_with_context(
                    query,
                    top_k=arguments.get("top_k", 5),
                    depth=depth
                )
                if result["results"]:
                    from src.toon_formatter import format_results_rich
                    text = format_results_rich(result["results"], result["context"])
                else:
                    text = "No results."

        elif name == "get_index_status":
            if is_indexed():
                from src.database import get_stats
                stats = get_stats()
                text = f"Indexed: {stats['total_functions']} functions"
            else:
                text = "Not indexed"
        else:
            text = f"Unknown tool: {name}"

        return [TextContent(type="text", text=text)]

    except Exception as e:
        return [TextContent(type="text", text=f"Error: {e}")]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
