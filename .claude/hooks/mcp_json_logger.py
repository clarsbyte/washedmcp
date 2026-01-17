#!/usr/bin/env python3
"""
Claude Code Hook: MCP Tool Call Logger
Intercepts all MCP tool calls and logs to JSON file
"""
import json
import sys
import os
import re
from datetime import datetime
from pathlib import Path

# JSON storage file location (in project root)
PROJECT_ROOT = Path(__file__).parent.parent.parent
JSON_LOG_FILE = PROJECT_ROOT / "mcp_tool_calls.json"


def extract_server_name(tool_name: str) -> str:
    """Extract server name from mcp__<SERVER>__<ACTION> pattern"""
    match = re.match(r'^mcp__([^_]+(?:_[^_]+)*)__', tool_name)
    if match:
        server_part = match.group(1)
        # Handle cases like "Playwright_MCP" -> "Playwright MCP"
        # or "washedmcp" -> "washedmcp"
        if '_' in server_part:
            return server_part.replace('_', ' ').title()
        return server_part
    return "Unknown"


def load_existing_data() -> list:
    """Load existing JSON data or return empty list"""
    if JSON_LOG_FILE.exists():
        try:
            with open(JSON_LOG_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except (json.JSONDecodeError, IOError) as e:
            print(f"[MCP Hook] Warning: Could not read existing log file: {e}", file=sys.stderr)
    return []


def save_to_json(record: dict):
    """Save tool call record to JSON file"""
    try:
        # Load existing data
        data = load_existing_data()

        # Append new record
        data.append(record)

        # Save back to file
        with open(JSON_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)

        print(f"[MCP Hook] Successfully saved to {JSON_LOG_FILE}", file=sys.stderr)

    except Exception as e:
        print(f"[MCP Hook] Error saving to JSON: {type(e).__name__}: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)


def main():
    """Main hook entry point"""
    try:
        # Read hook data from stdin
        hook_data = json.load(sys.stdin)

        # Extract fields
        hook_event = hook_data.get("hook_event_name")
        tool_name = hook_data.get("tool_name", "")

        # Debug log
        print(f"[MCP Hook] Received hook event: {hook_event}, tool: {tool_name}", file=sys.stderr)

        # Only process MCP tools
        if not tool_name.startswith("mcp__"):
            print(f"[MCP Hook] Skipping non-MCP tool: {tool_name}", file=sys.stderr)
            sys.exit(0)

        # Only process PostToolUse (has both input and result)
        if hook_event != "PostToolUse":
            print(f"[MCP Hook] Skipping {hook_event} (waiting for PostToolUse)", file=sys.stderr)
            sys.exit(0)

        # Extract data
        tool_input = hook_data.get("tool_input", {})
        tool_response = hook_data.get("tool_response", {})
        tool_use_id = hook_data.get("tool_use_id")
        server_name = extract_server_name(tool_name)

        print(f"[MCP Hook] Processing MCP tool: {tool_name} from server: {server_name}", file=sys.stderr)

        # Create record
        record = {
            "tool_name": tool_name,
            "server_name": server_name,
            "call_id": tool_use_id,
            "parameters": tool_input,
            "result": tool_response,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Save to JSON
        print(f"[MCP Hook] Saving tool call to JSON...", file=sys.stderr)
        save_to_json(record)
        print(f"[MCP Hook] Save completed", file=sys.stderr)

        # Exit (don't block Claude)
        sys.exit(0)

    except Exception as e:
        # Log error but don't fail the tool call
        print(f"[MCP Hook] Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(0)  # Exit 0 to not block Claude


if __name__ == "__main__":
    main()
