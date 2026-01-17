"""JSON-based storage for tool call logging (replaces Neo4j)."""
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict
import threading


@dataclass
class ToolCallRecord:
    """Record of a tool call."""
    tool_name: str
    parameters: Dict[str, Any]
    result: Any
    timestamp: str
    server_name: str
    call_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class JSONStorage:
    """Thread-safe JSON file storage for tool calls."""

    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize JSON storage.

        Args:
            storage_path: Path to JSON file. Defaults to 'tool_calls.json' in project root.
        """
        if storage_path is None:
            self.storage_path = Path(__file__).parent / "tool_calls.json"
        else:
            self.storage_path = Path(storage_path)

        self._lock = threading.Lock()
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        """Ensure the storage file exists."""
        if not self.storage_path.exists():
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump([], f)

    def _load_data(self) -> List[Dict]:
        """Load data from JSON file."""
        try:
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _save_data(self, data: List[Dict]):
        """Save data to JSON file."""
        with open(self.storage_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)

    def record_tool_call(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        result: Any,
        timestamp: Optional[datetime] = None,
        server_name: str = "unknown",
        call_id: Optional[str] = None
    ):
        """
        Record a tool call to JSON storage.

        Args:
            tool_name: Name of the tool called
            parameters: Parameters passed to the tool
            result: Result returned by the tool
            timestamp: When the call was made
            server_name: Name of the MCP server
            call_id: Unique ID for the call
        """
        if timestamp is None:
            timestamp = datetime.utcnow()

        record = ToolCallRecord(
            tool_name=tool_name,
            parameters=parameters,
            result=result,
            timestamp=timestamp.isoformat() if isinstance(timestamp, datetime) else str(timestamp),
            server_name=server_name,
            call_id=call_id
        )

        with self._lock:
            data = self._load_data()
            data.append(record.to_dict())
            self._save_data(data)

    def get_recent_calls(
        self,
        limit: int = 10,
        server_name: Optional[str] = None,
        tool_name: Optional[str] = None
    ) -> List[Dict]:
        """
        Get recent tool calls.

        Args:
            limit: Maximum number of calls to return
            server_name: Filter by server name
            tool_name: Filter by tool name

        Returns:
            List of tool call records
        """
        with self._lock:
            data = self._load_data()

        # Apply filters
        if server_name:
            data = [d for d in data if d.get("server_name") == server_name]
        if tool_name:
            data = [d for d in data if d.get("tool_name") == tool_name]

        # Sort by timestamp descending and limit
        data.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return data[:limit]

    def search_calls(
        self,
        query: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Search tool calls by query string.

        Args:
            query: Search string to match in tool name, parameters, or result
            limit: Maximum number of results

        Returns:
            List of matching tool call records
        """
        with self._lock:
            data = self._load_data()

        query_lower = query.lower()
        results = []

        for record in data:
            # Search in tool name
            if query_lower in record.get("tool_name", "").lower():
                results.append(record)
                continue

            # Search in parameters (as string)
            params_str = json.dumps(record.get("parameters", {})).lower()
            if query_lower in params_str:
                results.append(record)
                continue

            # Search in result (as string)
            result_str = json.dumps(record.get("result", {})).lower()
            if query_lower in result_str:
                results.append(record)

        # Sort by timestamp descending
        results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return results[:limit]

    def get_all_calls(self) -> List[Dict]:
        """Get all tool calls."""
        with self._lock:
            return self._load_data()

    def clear_all(self):
        """Clear all stored tool calls."""
        with self._lock:
            self._save_data([])

    def get_stats(self) -> Dict[str, Any]:
        """Get storage statistics."""
        with self._lock:
            data = self._load_data()

        servers = {}
        tools = {}

        for record in data:
            server = record.get("server_name", "unknown")
            tool = record.get("tool_name", "unknown")

            servers[server] = servers.get(server, 0) + 1
            tools[tool] = tools.get(tool, 0) + 1

        return {
            "total_calls": len(data),
            "servers": servers,
            "tools": tools
        }
