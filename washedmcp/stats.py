"""
WashedMCP Token Savings Statistics

Tracks cumulative token savings from using TOON format vs JSON across all searches.
Stats are persisted to disk and accumulate over time.
"""

import json
import os
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

from .logging_config import get_logger

logger = get_logger(__name__)

# Default stats file location
DEFAULT_STATS_PATH = Path.home() / ".washedmcp" / "stats.json"


@dataclass
class TokenStats:
    """Cumulative token savings statistics."""

    # Lifetime totals
    total_searches: int = 0
    total_json_chars: int = 0
    total_toon_chars: int = 0
    total_chars_saved: int = 0

    # Estimated tokens (chars / 4 approximation)
    total_json_tokens_est: int = 0
    total_toon_tokens_est: int = 0
    total_tokens_saved_est: int = 0

    # Percentage saved
    avg_savings_percent: float = 0.0

    # Timestamps
    first_search_at: Optional[str] = None
    last_search_at: Optional[str] = None

    # Session stats (reset on load)
    session_searches: int = 0
    session_chars_saved: int = 0
    session_tokens_saved_est: int = 0


class StatsTracker:
    """Tracks and persists token savings statistics."""

    def __init__(self, stats_path: Optional[Path] = None):
        self.stats_path = stats_path or DEFAULT_STATS_PATH
        self.stats = self._load_stats()

    def _load_stats(self) -> TokenStats:
        """Load stats from disk or create new."""
        if self.stats_path.exists():
            try:
                with open(self.stats_path, "r") as f:
                    data = json.load(f)
                    # Reset session stats on load
                    data["session_searches"] = 0
                    data["session_chars_saved"] = 0
                    data["session_tokens_saved_est"] = 0
                    return TokenStats(**data)
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"Failed to load stats, starting fresh: {e}")
        return TokenStats()

    def _save_stats(self):
        """Persist stats to disk."""
        try:
            self.stats_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.stats_path, "w") as f:
                json.dump(asdict(self.stats), f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save stats: {e}")

    def record_search(self, json_output: str, toon_output: str):
        """
        Record a search and calculate token savings.

        Args:
            json_output: The JSON-formatted output
            toon_output: The TOON-formatted output
        """
        json_chars = len(json_output)
        toon_chars = len(toon_output)
        chars_saved = json_chars - toon_chars

        # Estimate tokens (rough approximation: 1 token ≈ 4 chars)
        json_tokens = json_chars // 4
        toon_tokens = toon_chars // 4
        tokens_saved = json_tokens - toon_tokens

        # Update lifetime totals
        self.stats.total_searches += 1
        self.stats.total_json_chars += json_chars
        self.stats.total_toon_chars += toon_chars
        self.stats.total_chars_saved += chars_saved
        self.stats.total_json_tokens_est += json_tokens
        self.stats.total_toon_tokens_est += toon_tokens
        self.stats.total_tokens_saved_est += tokens_saved

        # Calculate average savings percentage
        if self.stats.total_json_chars > 0:
            self.stats.avg_savings_percent = round(
                (self.stats.total_chars_saved / self.stats.total_json_chars) * 100, 2
            )

        # Update timestamps
        now = datetime.now().isoformat()
        if not self.stats.first_search_at:
            self.stats.first_search_at = now
        self.stats.last_search_at = now

        # Update session stats
        self.stats.session_searches += 1
        self.stats.session_chars_saved += chars_saved
        self.stats.session_tokens_saved_est += tokens_saved

        # Persist
        self._save_stats()

        logger.debug(
            f"Search recorded: {chars_saved} chars saved ({tokens_saved} tokens est.), "
            f"lifetime total: {self.stats.total_tokens_saved_est} tokens"
        )

    def get_stats(self) -> TokenStats:
        """Get current statistics."""
        return self.stats

    def get_summary(self) -> str:
        """Get a human-readable summary of token savings."""
        s = self.stats

        if s.total_searches == 0:
            return "No searches recorded yet."

        lines = [
            "═══════════════════════════════════════════════════════",
            "           WashedMCP Token Savings Statistics           ",
            "═══════════════════════════════════════════════════════",
            "",
            f"  Total Searches:           {s.total_searches:,}",
            "",
            "  Character Savings:",
            f"    JSON output (total):    {s.total_json_chars:,} chars",
            f"    TOON output (total):    {s.total_toon_chars:,} chars",
            f"    Characters saved:       {s.total_chars_saved:,} chars",
            "",
            "  Estimated Token Savings:",
            f"    JSON tokens (est):      {s.total_json_tokens_est:,}",
            f"    TOON tokens (est):      {s.total_toon_tokens_est:,}",
            f"    Tokens saved (est):     {s.total_tokens_saved_est:,}",
            "",
            f"  Average Savings:          {s.avg_savings_percent}%",
            "",
            "  This Session:",
            f"    Searches:               {s.session_searches}",
            f"    Tokens saved:           {s.session_tokens_saved_est:,}",
            "",
            f"  Tracking since:           {s.first_search_at[:10] if s.first_search_at else 'N/A'}",
            f"  Last search:              {s.last_search_at[:19] if s.last_search_at else 'N/A'}",
            "",
            "═══════════════════════════════════════════════════════",
        ]

        return "\n".join(lines)

    def reset(self):
        """Reset all statistics."""
        self.stats = TokenStats()
        self._save_stats()
        logger.info("Statistics reset")


# Global tracker instance
_tracker: Optional[StatsTracker] = None


def get_tracker() -> StatsTracker:
    """Get the global stats tracker instance."""
    global _tracker
    if _tracker is None:
        _tracker = StatsTracker()
    return _tracker


def record_search(json_output: str, toon_output: str):
    """Record a search with its JSON and TOON outputs."""
    get_tracker().record_search(json_output, toon_output)


def get_token_savings_summary() -> str:
    """Get a summary of token savings."""
    return get_tracker().get_summary()


def get_token_stats() -> dict:
    """Get token statistics as a dictionary."""
    return asdict(get_tracker().get_stats())


def reset_stats():
    """Reset all statistics."""
    get_tracker().reset()


# CLI support
def main():
    """CLI entry point for viewing stats."""
    import argparse

    parser = argparse.ArgumentParser(description="WashedMCP Token Savings Statistics")
    parser.add_argument("--reset", action="store_true", help="Reset all statistics")
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    args = parser.parse_args()

    if args.reset:
        reset_stats()
        print("Statistics reset.")
    elif args.json:
        print(json.dumps(get_token_stats(), indent=2))
    else:
        print(get_token_savings_summary())


if __name__ == "__main__":
    main()
