"""
Tests for the toon_formatter module.

Tests Token-Optimized Object Notation (TOON) formatting,
JSON formatting, and rich context formatting.
"""

import json

import pytest

from washedmcp.toon_formatter import (
    truncate,
    format_results_toon,
    format_results_json,
    format_results_rich,
    format_results,
)


class TestTruncate:
    """Tests for truncate helper function."""

    def test_no_truncation_when_under_limit(self):
        """Should not truncate strings under max_length."""
        result = truncate("hello", 10)

        assert result == "hello"

    def test_no_truncation_at_limit(self):
        """Should not truncate strings exactly at max_length."""
        result = truncate("hello", 5)

        assert result == "hello"

    def test_truncates_over_limit(self):
        """Should truncate strings over max_length."""
        result = truncate("hello world", 8)

        assert len(result) == 8
        assert result.endswith("...")

    def test_truncate_preserves_start(self):
        """Should preserve the beginning of the string."""
        result = truncate("abcdefghij", 7)

        assert result.startswith("abcd")
        assert result == "abcd..."

    def test_truncate_empty_string(self):
        """Should handle empty strings."""
        result = truncate("", 5)

        assert result == ""

    def test_truncate_very_short_max(self):
        """Should handle very short max_length."""
        result = truncate("hello", 3)

        assert result == "..."


class TestFormatResultsToon:
    """Tests for TOON format output."""

    def test_empty_results(self):
        """Should handle empty results list."""
        result = format_results_toon([])

        assert "results" in result
        assert "(empty)" in result

    def test_single_result(self):
        """Should format single result correctly."""
        results = [{
            "function_name": "test_func",
            "file_path": "/src/test.py",
            "line_start": 10,
            "summary": "A test function",
            "similarity": 0.95,
        }]

        output = format_results_toon(results)

        assert "results" in output
        assert "test_func" in output
        assert "/src/test.py" in output
        assert "10" in output
        assert "95%" in output

    def test_multiple_results(self):
        """Should format multiple results."""
        results = [
            {
                "function_name": "func1",
                "file_path": "/a.py",
                "line_start": 1,
                "summary": "First",
                "similarity": 0.9,
            },
            {
                "function_name": "func2",
                "file_path": "/b.py",
                "line_start": 5,
                "summary": "Second",
                "similarity": 0.8,
            },
        ]

        output = format_results_toon(results)

        assert "func1" in output
        assert "func2" in output
        assert "90%" in output
        assert "80%" in output

    def test_truncates_long_values(self):
        """Should truncate values that exceed column width."""
        results = [{
            "function_name": "very_long_function_name_that_exceeds_limit",
            "file_path": "/very/long/path/to/file/that/exceeds/limit.py",
            "line_start": 100,
            "summary": "A very long summary that definitely exceeds the maximum column width for summaries",
            "similarity": 0.75,
        }]

        output = format_results_toon(results)

        # Should contain truncation indicators
        assert "..." in output

    def test_header_row_present(self):
        """Should include header row."""
        results = [{
            "function_name": "test",
            "file_path": "/test.py",
            "line_start": 1,
            "summary": "test",
            "similarity": 0.5,
        }]

        output = format_results_toon(results)

        assert "function_name" in output
        assert "file_path" in output
        assert "similarity" in output

    def test_handles_missing_fields(self):
        """Should handle results with missing fields."""
        results = [{
            "function_name": "test",
            "file_path": "/test.py",
            "line_start": 1,
            # Missing summary and similarity
        }]

        output = format_results_toon(results)

        assert "test" in output
        # Should not crash


class TestFormatResultsJson:
    """Tests for JSON format output."""

    def test_valid_json(self):
        """Should produce valid JSON."""
        results = [{
            "function_name": "test",
            "file_path": "/test.py",
            "line_start": 1,
            "summary": "Test function",
            "similarity": 0.9,
        }]

        output = format_results_json(results)

        # Should be parseable as JSON
        parsed = json.loads(output)
        assert isinstance(parsed, list)
        assert len(parsed) == 1

    def test_preserves_all_fields(self):
        """Should preserve all input fields."""
        results = [{
            "function_name": "test",
            "file_path": "/test.py",
            "line_start": 1,
            "line_end": 5,
            "summary": "Test function",
            "similarity": 0.9,
            "extra_field": "preserved",
        }]

        output = format_results_json(results)
        parsed = json.loads(output)

        assert parsed[0]["extra_field"] == "preserved"

    def test_empty_results(self):
        """Should handle empty results list."""
        output = format_results_json([])
        parsed = json.loads(output)

        assert parsed == []

    def test_multiple_results(self):
        """Should handle multiple results."""
        results = [
            {"function_name": "a", "file_path": "/a.py", "line_start": 1, "summary": "", "similarity": 0.9},
            {"function_name": "b", "file_path": "/b.py", "line_start": 2, "summary": "", "similarity": 0.8},
        ]

        output = format_results_json(results)
        parsed = json.loads(output)

        assert len(parsed) == 2


class TestFormatResultsRich:
    """Tests for rich format output with context."""

    def test_no_results(self):
        """Should handle no results."""
        output = format_results_rich([])

        assert "No results found" in output

    def test_shows_best_match(self):
        """Should show best match prominently."""
        results = [{
            "function_name": "validate",
            "file_path": "/auth.py",
            "line_start": 42,
            "similarity": 0.92,
            "code": "def validate(x): return True",
        }]

        output = format_results_rich(results)

        assert "FOUND:" in output
        assert "validate()" in output
        assert "/auth.py:42" in output
        assert "92%" in output

    def test_shows_code(self):
        """Should show the code."""
        results = [{
            "function_name": "test",
            "file_path": "/test.py",
            "line_start": 1,
            "similarity": 0.9,
            "code": "def test():\n    return True",
        }]

        output = format_results_rich(results)

        assert "CODE:" in output
        assert "def test():" in output
        assert "return True" in output

    def test_shows_context_callees(self):
        """Should show callees from context."""
        results = [{
            "function_name": "caller",
            "file_path": "/test.py",
            "line_start": 1,
            "similarity": 0.9,
            "code": "def caller(): callee()",
        }]
        context = {
            "callees": [
                {"function_name": "callee", "file_path": "/test.py", "line_start": 10}
            ],
            "callers": [],
            "same_file": [],
        }

        output = format_results_rich(results, context)

        assert "CALLS:" in output
        assert "callee" in output

    def test_shows_context_callers(self):
        """Should show callers from context."""
        results = [{
            "function_name": "helper",
            "file_path": "/test.py",
            "line_start": 1,
            "similarity": 0.9,
            "code": "def helper(): pass",
        }]
        context = {
            "callees": [],
            "callers": [
                {"function_name": "main", "file_path": "/test.py", "line_start": 20},
                {"function_name": "process", "file_path": "/test.py", "line_start": 30},
            ],
            "same_file": [],
        }

        output = format_results_rich(results, context)

        assert "CALLED BY:" in output
        assert "main" in output
        assert "process" in output

    def test_shows_same_file(self):
        """Should show other functions in same file."""
        results = [{
            "function_name": "func1",
            "file_path": "/utils.py",
            "line_start": 1,
            "similarity": 0.9,
            "code": "def func1(): pass",
        }]
        context = {
            "callees": [],
            "callers": [],
            "same_file": [
                {"function_name": "func2", "file_path": "/utils.py", "line_start": 5},
                {"function_name": "func3", "file_path": "/utils.py", "line_start": 10},
            ],
        }

        output = format_results_rich(results, context)

        assert "SAME FILE:" in output
        assert "func2" in output
        assert "func3" in output

    def test_shows_additional_matches(self):
        """Should show additional matches after best match."""
        results = [
            {"function_name": "best", "file_path": "/a.py", "line_start": 1, "similarity": 0.95, "code": "pass"},
            {"function_name": "second", "file_path": "/b.py", "line_start": 5, "similarity": 0.85, "code": "pass"},
            {"function_name": "third", "file_path": "/c.py", "line_start": 10, "similarity": 0.75, "code": "pass"},
        ]

        output = format_results_rich(results)

        assert "Additional matches:" in output
        assert "/b.py:5" in output
        assert "/c.py:10" in output

    def test_truncates_long_code(self):
        """Should truncate very long code."""
        long_code = "\n".join([f"line {i}" for i in range(50)])
        results = [{
            "function_name": "long_func",
            "file_path": "/test.py",
            "line_start": 1,
            "similarity": 0.9,
            "code": long_code,
        }]

        output = format_results_rich(results)

        # Should be truncated (20 lines max + truncation notice)
        assert "truncated" in output.lower()

    def test_no_context(self):
        """Should handle None context."""
        results = [{
            "function_name": "test",
            "file_path": "/test.py",
            "line_start": 1,
            "similarity": 0.9,
            "code": "def test(): pass",
        }]

        output = format_results_rich(results, context=None)

        # Should not include CALLS/CALLED BY sections
        assert "CALLS:" not in output
        assert "CALLED BY:" not in output


class TestFormatResults:
    """Tests for the unified format_results function."""

    def test_toon_format(self, sample_search_results):
        """Should use TOON format when specified."""
        output = format_results(sample_search_results, format="toon")

        assert "results" in output
        assert "function_name" in output

    def test_json_format(self, sample_search_results):
        """Should use JSON format when specified."""
        output = format_results(sample_search_results, format="json")

        parsed = json.loads(output)
        assert isinstance(parsed, list)

    def test_rich_format(self, sample_search_results):
        """Should use rich format when specified."""
        output = format_results(sample_search_results, format="rich")

        assert "FOUND:" in output

    def test_rich_format_with_context(self, sample_search_results, sample_context):
        """Should pass context to rich format."""
        output = format_results(sample_search_results, format="rich", context=sample_context)

        assert "CALLS:" in output or "CALLED BY:" in output or "SAME FILE:" in output

    def test_invalid_format_raises(self, sample_search_results):
        """Should raise ValueError for unknown format."""
        with pytest.raises(ValueError, match="Unknown format"):
            format_results(sample_search_results, format="invalid")

    def test_default_format_is_toon(self, sample_search_results):
        """Should default to TOON format."""
        output = format_results(sample_search_results)

        # TOON format starts with "results"
        assert output.startswith("results")


class TestTokenEfficiency:
    """Tests comparing token efficiency of formats."""

    def test_toon_shorter_than_json(self, sample_search_results):
        """TOON format should generally be shorter than JSON."""
        toon_output = format_results(sample_search_results, format="toon")
        json_output = format_results(sample_search_results, format="json")

        # TOON should be more compact
        assert len(toon_output) < len(json_output)

    def test_toon_readability(self):
        """TOON format should be human-readable."""
        results = [{
            "function_name": "process",
            "file_path": "/src/main.py",
            "line_start": 42,
            "summary": "Process data",
            "similarity": 0.88,
        }]

        output = format_results_toon(results)

        # Should be readable without parsing
        lines = output.split("\n")
        assert len(lines) >= 2  # Header + at least one data row

        # Values should be visible
        assert "process" in output
        assert "88%" in output
