"""Metadata Manager for MCP installation database."""
import json
from pathlib import Path
from typing import Optional, Dict, List, Any
from datetime import datetime


class MetadataManager:
    """Manage MCP metadata database operations."""

    def __init__(self, metadata_path: Optional[str] = None):
        """
        Initialize metadata manager.

        Args:
            metadata_path: Path to metadata JSON file. If None, uses default location.
        """
        if metadata_path is None:
            self.metadata_path = Path(__file__).parent.parent / "mcp_metadata.json"
        else:
            self.metadata_path = Path(metadata_path)

        self._load_metadata()

    def _load_metadata(self):
        """Load metadata from JSON file."""
        if not self.metadata_path.exists():
            self.metadata = {
                "version": "1.0.0",
                "last_updated": datetime.now().isoformat(),
                "mcps": {}
            }
        else:
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)

    def get_mcp(self, name: str) -> Optional[Dict]:
        """
        Get MCP metadata by name (case-insensitive).

        Args:
            name: MCP name or ID

        Returns:
            MCP metadata dict or None if not found
        """
        name_lower = name.lower()

        # Try exact ID match first
        if name_lower in self.metadata["mcps"]:
            return self.metadata["mcps"][name_lower]

        # Try matching by display name
        for mcp_id, mcp_data in self.metadata["mcps"].items():
            if mcp_data["name"].lower() == name_lower:
                return mcp_data

        return None

    def list_all(self) -> List[Dict]:
        """
        List all MCPs in the database.

        Returns:
            List of MCP metadata dicts
        """
        return list(self.metadata["mcps"].values())

    def list_by_category(self, category: str) -> List[Dict]:
        """
        List MCPs by category.

        Args:
            category: Category name (e.g., 'development', 'automation')

        Returns:
            List of MCP metadata dicts in the category
        """
        return [
            mcp for mcp in self.metadata["mcps"].values()
            if mcp.get("category", "").lower() == category.lower()
        ]

    def search(self, query: str) -> List[Dict]:
        """
        Search MCPs by name or description.

        Args:
            query: Search query

        Returns:
            List of matching MCP metadata dicts
        """
        query_lower = query.lower()
        results = []

        for mcp in self.metadata["mcps"].values():
            if (query_lower in mcp["name"].lower() or
                query_lower in mcp["description"].lower()):
                results.append(mcp)

        return results

    def add_mcp(self, mcp_id: str, mcp_data: Dict):
        """
        Add new MCP to metadata database.

        Args:
            mcp_id: Unique MCP identifier (lowercase, hyphenated)
            mcp_data: MCP metadata dict
        """
        self.metadata["mcps"][mcp_id] = mcp_data
        self.metadata["last_updated"] = datetime.now().isoformat()
        self._save_metadata()

    def update_mcp(self, mcp_id: str, mcp_data: Dict):
        """
        Update existing MCP metadata.

        Args:
            mcp_id: MCP identifier
            mcp_data: Updated metadata (partial or full)
        """
        if mcp_id in self.metadata["mcps"]:
            self.metadata["mcps"][mcp_id].update(mcp_data)
            self.metadata["last_updated"] = datetime.now().isoformat()
            self._save_metadata()

    def delete_mcp(self, mcp_id: str) -> bool:
        """
        Delete MCP from database.

        Args:
            mcp_id: MCP identifier

        Returns:
            True if deleted, False if not found
        """
        if mcp_id in self.metadata["mcps"]:
            del self.metadata["mcps"][mcp_id]
            self.metadata["last_updated"] = datetime.now().isoformat()
            self._save_metadata()
            return True
        return False

    def _save_metadata(self):
        """Save metadata to JSON file."""
        with open(self.metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False)

    def get_installation_methods(self, mcp_name: str) -> List[str]:
        """
        Get available installation methods for an MCP.

        Args:
            mcp_name: MCP name or ID

        Returns:
            List of installation method names
        """
        mcp = self.get_mcp(mcp_name)
        if not mcp:
            return []

        return list(mcp.get("installation", {}).get("methods", {}).keys())

    def get_required_env_vars(self, mcp_name: str) -> List[Dict]:
        """
        Get required environment variables for an MCP.

        Args:
            mcp_name: MCP name or ID

        Returns:
            List of env var specification dicts
        """
        mcp = self.get_mcp(mcp_name)
        if not mcp:
            return []

        return mcp.get("configuration", {}).get("env_vars", {}).get("required", [])

    def get_stats(self) -> Dict[str, Any]:
        """
        Get database statistics.

        Returns:
            Statistics dict with counts and categories
        """
        mcps = self.metadata["mcps"]

        categories = {}
        tested_count = 0
        methods_count = {}

        for mcp_data in mcps.values():
            # Count by category
            category = mcp_data.get("category", "uncategorized")
            categories[category] = categories.get(category, 0) + 1

            # Count tested installations
            installation = mcp_data.get("installation", {})
            for method_name, method_data in installation.get("methods", {}).items():
                if method_data.get("tested", False):
                    tested_count += 1
                methods_count[method_name] = methods_count.get(method_name, 0) + 1

        return {
            "total_mcps": len(mcps),
            "categories": categories,
            "tested_installations": tested_count,
            "installation_methods": methods_count,
            "last_updated": self.metadata.get("last_updated", "unknown")
        }


# Example usage
if __name__ == "__main__":
    manager = MetadataManager()

    # Get GitHub MCP
    github = manager.get_mcp("github-mcp")
    if github:
        print(f"Found: {github['name']}")
        print(f"Methods: {list(github['installation']['methods'].keys())}")

    # List all MCPs
    all_mcps = manager.list_all()
    print(f"\nTotal MCPs: {len(all_mcps)}")

    # Get stats
    stats = manager.get_stats()
    print(f"\nStats: {json.dumps(stats, indent=2)}")
