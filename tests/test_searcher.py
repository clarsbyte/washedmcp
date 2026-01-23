"""
Tests for the searcher module.

Tests semantic code search functionality including
search_code, is_indexed, and search_code_with_context.
"""

import os
import tempfile
from unittest.mock import patch, MagicMock

import pytest

from washedmcp.searcher import (
    search_code,
    is_indexed,
    search_code_with_context,
)


@pytest.fixture
def db_temp_dir():
    """Create a temporary directory for database tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture
def populated_db(db_temp_dir, reset_database_globals, mock_embedding):
    """Create a populated database for search tests."""
    from washedmcp.database import init_db, add_functions, compute_called_by

    db_path = os.path.join(db_temp_dir, "chroma")
    init_db(persist_path=db_path)

    # Add test functions
    functions = [
        {
            "name": "validate_email",
            "code": "def validate_email(email):\n    return '@' in email",
            "file_path": "/src/auth.py",
            "line_start": 10,
            "line_end": 12,
            "language": "python",
            "summary": "Validates email format",
            "embedding": mock_embedding,
            "calls": [],
        },
        {
            "name": "hash_password",
            "code": "def hash_password(pwd):\n    return hashlib.sha256(pwd).hexdigest()",
            "file_path": "/src/auth.py",
            "line_start": 15,
            "line_end": 17,
            "language": "python",
            "summary": "Hashes password using SHA256",
            "embedding": [0.2] * 384,
            "calls": ["hashlib.sha256"],
        },
        {
            "name": "create_user",
            "code": "def create_user(email, pwd):\n    validate_email(email)\n    hash_password(pwd)",
            "file_path": "/src/users.py",
            "line_start": 5,
            "line_end": 8,
            "language": "python",
            "summary": "Creates a new user",
            "embedding": [0.3] * 384,
            "calls": ["validate_email", "hash_password"],
        },
    ]
    add_functions(functions)
    compute_called_by()

    return db_path


class TestSearchCode:
    """Tests for search_code function."""

    def test_search_returns_results(self, populated_db, mock_embed_query):
        """Should return search results."""
        results = search_code("email validation", persist_path=populated_db)

        assert isinstance(results, list)
        assert len(results) > 0

    def test_search_respects_top_k(self, populated_db, mock_embed_query):
        """Should return at most top_k results."""
        results = search_code("validation", persist_path=populated_db, top_k=2)

        assert len(results) <= 2

    def test_search_returns_function_details(self, populated_db, mock_embed_query):
        """Should return complete function details."""
        results = search_code("email", persist_path=populated_db, top_k=1)

        assert len(results) > 0
        result = results[0]
        assert "function_name" in result
        assert "file_path" in result
        assert "code" in result
        assert "similarity" in result

    def test_search_empty_query_handled(self, populated_db):
        """Should handle search gracefully even with issues."""
        # The embedder will raise ValueError for empty query
        results = search_code("", persist_path=populated_db)

        # Should return empty list on error
        assert results == []

    def test_search_with_depth_returns_context(self, populated_db, mock_embed_query):
        """Should return context when depth > 0."""
        result = search_code("create user", persist_path=populated_db, depth=1)

        assert isinstance(result, dict)
        assert "results" in result
        assert "context" in result

    def test_search_without_depth_returns_list(self, populated_db, mock_embed_query):
        """Should return list when depth = 0."""
        results = search_code("email", persist_path=populated_db, depth=0)

        assert isinstance(results, list)

    def test_search_derives_path_from_project_path(self, db_temp_dir, reset_database_globals, mock_embedding):
        """Should derive persist_path from project_path."""
        from washedmcp.database import init_db, add_functions

        # Create nested structure like a real project
        project_path = os.path.join(db_temp_dir, "myproject")
        os.makedirs(project_path, exist_ok=True)

        # Initialize DB at expected location
        expected_db_path = os.path.join(project_path, ".washedmcp", "chroma")
        init_db(persist_path=expected_db_path)
        add_functions([{
            "name": "test_func",
            "code": "def test_func(): pass",
            "file_path": "/test.py",
            "line_start": 1,
            "line_end": 1,
            "language": "python",
            "embedding": mock_embedding,
        }])

        # Search using project_path instead of persist_path
        with patch("washedmcp.embedder.embed_query", return_value=mock_embedding):
            results = search_code("test", project_path=project_path)

        assert len(results) == 1

    def test_search_nonexistent_path(self, db_temp_dir):
        """Should return empty for nonexistent database."""
        fake_path = os.path.join(db_temp_dir, "nonexistent", "chroma")

        results = search_code("anything", persist_path=fake_path)

        # Should handle gracefully
        assert results == [] or results == {"results": [], "context": None}


class TestIsIndexed:
    """Tests for is_indexed function."""

    def test_is_indexed_true(self, populated_db):
        """Should return True for populated database."""
        result = is_indexed(persist_path=populated_db)

        assert result is True

    def test_is_indexed_false_empty(self, db_temp_dir, reset_database_globals):
        """Should return False for empty database."""
        from washedmcp.database import init_db

        db_path = os.path.join(db_temp_dir, "empty_chroma")
        init_db(persist_path=db_path)

        result = is_indexed(persist_path=db_path)

        assert result is False

    def test_is_indexed_false_nonexistent(self, db_temp_dir):
        """Should return False for nonexistent path."""
        fake_path = os.path.join(db_temp_dir, "nonexistent")

        result = is_indexed(persist_path=fake_path)

        assert result is False

    def test_is_indexed_with_project_path(self, db_temp_dir, reset_database_globals, mock_embedding):
        """Should derive persist_path from project_path."""
        from washedmcp.database import init_db, add_functions

        project_path = os.path.join(db_temp_dir, "myproject")
        os.makedirs(project_path, exist_ok=True)

        expected_db_path = os.path.join(project_path, ".washedmcp", "chroma")
        init_db(persist_path=expected_db_path)
        add_functions([{
            "name": "func",
            "code": "def func(): pass",
            "file_path": "/test.py",
            "line_start": 1,
            "line_end": 1,
            "language": "python",
            "embedding": mock_embedding,
        }])

        result = is_indexed(project_path=project_path)

        assert result is True

    def test_is_indexed_handles_exceptions(self, db_temp_dir):
        """Should return False on exceptions."""
        # Path to a file instead of directory
        file_path = os.path.join(db_temp_dir, "not_a_dir.txt")
        with open(file_path, "w") as f:
            f.write("not a database")

        result = is_indexed(persist_path=file_path)

        assert result is False


class TestSearchCodeWithContext:
    """Tests for search_code_with_context function."""

    def test_returns_results_and_context(self, populated_db, mock_embed_query):
        """Should return both results and context."""
        result = search_code_with_context("user creation", persist_path=populated_db)

        assert isinstance(result, dict)
        assert "results" in result
        assert "context" in result

    def test_context_includes_relationships(self, populated_db, mock_embed_query):
        """Should include relationship data in context."""
        result = search_code_with_context(
            "create user",
            persist_path=populated_db,
            depth=1
        )

        context = result.get("context")
        if context and context.get("function"):
            # Context should have callees, callers, same_file
            assert "callees" in context
            assert "callers" in context
            assert "same_file" in context

    def test_context_is_none_for_no_results(self, db_temp_dir, reset_database_globals, mock_embed_query):
        """Should return None context when no results."""
        from washedmcp.database import init_db

        db_path = os.path.join(db_temp_dir, "empty")
        init_db(persist_path=db_path)

        result = search_code_with_context("anything", persist_path=db_path)

        assert result["results"] == []
        assert result["context"] is None

    def test_respects_top_k(self, populated_db, mock_embed_query):
        """Should respect top_k parameter."""
        result = search_code_with_context(
            "function",
            persist_path=populated_db,
            top_k=1
        )

        assert len(result["results"]) <= 1

    def test_respects_depth(self, populated_db, mock_embed_query):
        """Should pass depth to context expansion."""
        # With depth=0, context should be None
        result_depth_0 = search_code_with_context(
            "email",
            persist_path=populated_db,
            depth=0
        )

        assert result_depth_0["context"] is None

        # With depth=1, context should be populated
        result_depth_1 = search_code_with_context(
            "email",
            persist_path=populated_db,
            depth=1
        )

        # Context may or may not have data depending on matches
        # but the key should exist
        assert "context" in result_depth_1


class TestSearchEdgeCases:
    """Tests for edge cases in search."""

    def test_search_special_characters(self, populated_db, mock_embed_query):
        """Should handle special characters in query."""
        results = search_code("def validate_email()", persist_path=populated_db)

        # Should not crash
        assert isinstance(results, list)

    def test_search_unicode_query(self, populated_db, mock_embed_query):
        """Should handle unicode in query."""
        results = search_code("validar correo electronico", persist_path=populated_db)

        assert isinstance(results, list)

    def test_search_very_long_query(self, populated_db, mock_embed_query):
        """Should handle very long queries."""
        long_query = "validate " * 100
        results = search_code(long_query, persist_path=populated_db)

        assert isinstance(results, list)

    def test_search_with_context_on_error(self, db_temp_dir, reset_database_globals):
        """Should handle errors gracefully with depth > 0."""
        fake_path = os.path.join(db_temp_dir, "fake")

        result = search_code("test", persist_path=fake_path, depth=1)

        # Should return error format
        assert result == {"results": [], "context": None}
