"""
Tests for the database module.

Tests ChromaDB operations including adding functions,
searching, computing called_by relationships, and context expansion.
"""

import json
import os
import tempfile

import pytest

from washedmcp.database import (
    init_db,
    add_functions,
    search,
    clear_collection,
    get_stats,
    compute_called_by,
    get_file_functions,
    get_function_context,
    _get_collection,
    _get_function_by_name,
)


@pytest.fixture
def db_temp_dir():
    """Create a temporary directory for database tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture
def fresh_db(db_temp_dir, reset_database_globals):
    """Initialize a fresh database for each test."""
    db_path = os.path.join(db_temp_dir, "test_chroma")
    collection = init_db(persist_path=db_path)
    yield collection
    # Cleanup happens automatically via reset_database_globals


class TestInitDb:
    """Tests for database initialization."""

    def test_init_creates_collection(self, db_temp_dir, reset_database_globals):
        """Should create a collection on init."""
        db_path = os.path.join(db_temp_dir, "chroma")
        collection = init_db(persist_path=db_path)

        assert collection is not None
        assert collection.name == "codebase"

    def test_init_creates_directory(self, db_temp_dir, reset_database_globals):
        """Should create persist directory if it doesn't exist."""
        db_path = os.path.join(db_temp_dir, "nested", "path", "chroma")
        init_db(persist_path=db_path)

        assert os.path.exists(db_path)

    def test_init_uses_cosine_similarity(self, db_temp_dir, reset_database_globals):
        """Should configure collection for cosine similarity."""
        db_path = os.path.join(db_temp_dir, "chroma")
        collection = init_db(persist_path=db_path)

        metadata = collection.metadata
        assert metadata.get("hnsw:space") == "cosine"

    def test_init_twice_returns_same_collection(self, db_temp_dir, reset_database_globals):
        """Calling init twice should return the same collection."""
        db_path = os.path.join(db_temp_dir, "chroma")
        collection1 = init_db(persist_path=db_path)
        collection2 = init_db(persist_path=db_path)

        assert collection1.name == collection2.name

    def test_get_collection_auto_init(self, db_temp_dir, reset_database_globals):
        """_get_collection should auto-initialize if needed."""
        # Don't call init_db, just get_collection
        collection = _get_collection()

        assert collection is not None


class TestAddFunctions:
    """Tests for adding functions to the database."""

    def test_add_single_function(self, fresh_db, sample_function_dict):
        """Should add a single function."""
        add_functions([sample_function_dict])

        stats = get_stats()
        assert stats["total_functions"] == 1

    def test_add_multiple_functions(self, fresh_db, sample_functions_with_calls):
        """Should add multiple functions."""
        add_functions(sample_functions_with_calls)

        stats = get_stats()
        assert stats["total_functions"] == 3

    def test_add_empty_list(self, fresh_db):
        """Should handle empty list gracefully."""
        add_functions([])

        stats = get_stats()
        assert stats["total_functions"] == 0

    def test_add_stores_metadata(self, fresh_db, sample_function_dict):
        """Should store all metadata fields."""
        add_functions([sample_function_dict])

        # Search to retrieve and verify
        results = search(sample_function_dict["embedding"], top_k=1)

        assert len(results) == 1
        assert results[0]["function_name"] == sample_function_dict["name"]
        assert results[0]["file_path"] == sample_function_dict["file_path"]
        assert results[0]["line_start"] == sample_function_dict["line_start"]

    def test_add_stores_calls(self, fresh_db, mock_embedding):
        """Should store calls metadata."""
        func = {
            "name": "caller",
            "code": "def caller(): callee()",
            "file_path": "/test.py",
            "line_start": 1,
            "line_end": 1,
            "language": "python",
            "summary": "",
            "embedding": mock_embedding,
            "calls": ["callee", "helper"],
        }
        add_functions([func])

        results = search(mock_embedding, top_k=1)

        assert results[0]["calls"] == ["callee", "helper"]

    def test_add_deduplicates_by_id(self, fresh_db, sample_function_dict):
        """Should not add duplicate functions (same file/name/line)."""
        # Add same function twice
        add_functions([sample_function_dict])
        add_functions([sample_function_dict])

        stats = get_stats()
        assert stats["total_functions"] == 1

    def test_add_handles_missing_optional_fields(self, fresh_db, mock_embedding):
        """Should handle functions without optional fields."""
        func = {
            "name": "minimal",
            "code": "def minimal(): pass",
            "file_path": "/test.py",
            "line_start": 1,
            "line_end": 1,
            "language": "python",
            "embedding": mock_embedding,
            # No summary, calls, imports, exported
        }
        add_functions([func])

        results = search(mock_embedding, top_k=1)

        assert results[0]["function_name"] == "minimal"
        assert results[0]["calls"] == []
        assert results[0]["exported"] == False


class TestSearch:
    """Tests for semantic search."""

    def test_search_returns_results(self, fresh_db, sample_functions_with_calls):
        """Should return search results."""
        add_functions(sample_functions_with_calls)

        results = search([0.1] * 384, top_k=3)

        assert len(results) > 0

    def test_search_respects_top_k(self, fresh_db, sample_functions_with_calls):
        """Should return at most top_k results."""
        add_functions(sample_functions_with_calls)

        results = search([0.1] * 384, top_k=2)

        assert len(results) <= 2

    def test_search_empty_db_returns_empty(self, fresh_db):
        """Should return empty list for empty database."""
        results = search([0.1] * 384, top_k=5)

        assert results == []

    def test_search_returns_similarity_score(self, fresh_db, sample_function_dict):
        """Should include similarity score in results."""
        add_functions([sample_function_dict])

        results = search(sample_function_dict["embedding"], top_k=1)

        assert "similarity" in results[0]
        assert 0 <= results[0]["similarity"] <= 1

    def test_search_returns_code(self, fresh_db, sample_function_dict):
        """Should return the function code."""
        add_functions([sample_function_dict])

        results = search(sample_function_dict["embedding"], top_k=1)

        assert results[0]["code"] == sample_function_dict["code"]

    def test_search_similar_embedding_ranks_higher(self, fresh_db, mock_embedding):
        """More similar embeddings should rank higher."""
        # Add function with embedding [0.1, 0.1, ...]
        func1 = {
            "name": "similar",
            "code": "def similar(): pass",
            "file_path": "/test.py",
            "line_start": 1,
            "line_end": 1,
            "language": "python",
            "embedding": [0.1] * 384,
        }
        # Add function with embedding [0.9, 0.9, ...]
        func2 = {
            "name": "different",
            "code": "def different(): pass",
            "file_path": "/test.py",
            "line_start": 5,
            "line_end": 5,
            "language": "python",
            "embedding": [0.9] * 384,
        }
        add_functions([func1, func2])

        # Search with embedding close to func1
        results = search([0.1] * 384, top_k=2)

        # func1 should be first (more similar)
        assert results[0]["function_name"] == "similar"

    def test_search_top_k_larger_than_db(self, fresh_db, sample_function_dict):
        """Should handle top_k larger than database size."""
        add_functions([sample_function_dict])

        results = search(sample_function_dict["embedding"], top_k=100)

        # Should return all available (1 in this case)
        assert len(results) == 1


class TestClearCollection:
    """Tests for clearing the collection."""

    def test_clear_removes_all_items(self, fresh_db, sample_functions_with_calls):
        """Should remove all functions from collection."""
        add_functions(sample_functions_with_calls)
        assert get_stats()["total_functions"] == 3

        clear_collection()

        assert get_stats()["total_functions"] == 0

    def test_clear_empty_collection(self, fresh_db):
        """Should handle clearing empty collection."""
        clear_collection()

        assert get_stats()["total_functions"] == 0


class TestGetStats:
    """Tests for getting collection statistics."""

    def test_stats_returns_count(self, fresh_db, sample_functions_with_calls):
        """Should return correct function count."""
        add_functions(sample_functions_with_calls)

        stats = get_stats()

        assert stats["total_functions"] == 3

    def test_stats_empty_db(self, fresh_db):
        """Should return 0 for empty database."""
        stats = get_stats()

        assert stats["total_functions"] == 0


class TestComputeCalledBy:
    """Tests for computing reverse call relationships."""

    def test_compute_called_by_creates_relationships(self, fresh_db, sample_functions_with_calls):
        """Should compute called_by from calls."""
        add_functions(sample_functions_with_calls)
        compute_called_by()

        # process_data calls calculate_sum, so calculate_sum should have process_data in called_by
        context = get_function_context("calculate_sum")

        assert context["function"] is not None
        assert "process_data" in context["function"]["called_by"]

    def test_compute_called_by_multiple_callers(self, fresh_db, mock_embedding):
        """Should track multiple callers."""
        funcs = [
            {
                "name": "target",
                "code": "def target(): pass",
                "file_path": "/test.py",
                "line_start": 1,
                "line_end": 1,
                "language": "python",
                "embedding": mock_embedding,
                "calls": [],
            },
            {
                "name": "caller1",
                "code": "def caller1(): target()",
                "file_path": "/test.py",
                "line_start": 5,
                "line_end": 5,
                "language": "python",
                "embedding": [0.2] * 384,
                "calls": ["target"],
            },
            {
                "name": "caller2",
                "code": "def caller2(): target()",
                "file_path": "/test.py",
                "line_start": 10,
                "line_end": 10,
                "language": "python",
                "embedding": [0.3] * 384,
                "calls": ["target"],
            },
        ]
        add_functions(funcs)
        compute_called_by()

        context = get_function_context("target")

        assert "caller1" in context["function"]["called_by"]
        assert "caller2" in context["function"]["called_by"]

    def test_compute_called_by_empty_db(self, fresh_db):
        """Should handle empty database."""
        compute_called_by()  # Should not raise

        stats = get_stats()
        assert stats["total_functions"] == 0


class TestGetFileFunctions:
    """Tests for getting all functions in a file."""

    def test_get_file_functions_returns_all(self, fresh_db, sample_functions_with_calls):
        """Should return all functions in a file."""
        add_functions(sample_functions_with_calls)

        # /test/example.py has process_data and calculate_sum
        funcs = get_file_functions("/test/example.py")

        names = [f["function_name"] for f in funcs]
        assert "process_data" in names
        assert "calculate_sum" in names
        assert len(funcs) == 2

    def test_get_file_functions_different_file(self, fresh_db, sample_functions_with_calls):
        """Should only return functions from specified file."""
        add_functions(sample_functions_with_calls)

        # /test/main.py has only main
        funcs = get_file_functions("/test/main.py")

        assert len(funcs) == 1
        assert funcs[0]["function_name"] == "main"

    def test_get_file_functions_nonexistent(self, fresh_db, sample_functions_with_calls):
        """Should return empty for nonexistent file."""
        add_functions(sample_functions_with_calls)

        funcs = get_file_functions("/nonexistent/file.py")

        assert funcs == []

    def test_get_file_functions_empty_db(self, fresh_db):
        """Should return empty for empty database."""
        funcs = get_file_functions("/any/file.py")

        assert funcs == []


class TestGetFunctionContext:
    """Tests for getting function context with relationships."""

    def test_context_includes_function(self, fresh_db, sample_functions_with_calls):
        """Should include the main function."""
        add_functions(sample_functions_with_calls)

        context = get_function_context("process_data")

        assert context["function"] is not None
        assert context["function"]["function_name"] == "process_data"

    def test_context_includes_callees(self, fresh_db, sample_functions_with_calls):
        """Should include functions that are called (callees)."""
        add_functions(sample_functions_with_calls)
        compute_called_by()

        context = get_function_context("process_data")

        callee_names = [f["function_name"] for f in context["callees"]]
        assert "calculate_sum" in callee_names

    def test_context_includes_callers(self, fresh_db, sample_functions_with_calls):
        """Should include functions that call this one (callers)."""
        add_functions(sample_functions_with_calls)
        compute_called_by()

        context = get_function_context("process_data")

        caller_names = [f["function_name"] for f in context["callers"]]
        assert "main" in caller_names

    def test_context_includes_same_file(self, fresh_db, sample_functions_with_calls):
        """Should include other functions in same file."""
        add_functions(sample_functions_with_calls)

        context = get_function_context("process_data")

        same_file_names = [f["function_name"] for f in context["same_file"]]
        assert "calculate_sum" in same_file_names
        # Should not include self
        assert "process_data" not in same_file_names

    def test_context_nonexistent_function(self, fresh_db, sample_functions_with_calls):
        """Should return empty context for nonexistent function."""
        add_functions(sample_functions_with_calls)

        context = get_function_context("nonexistent")

        assert context["function"] is None
        assert context["callees"] == []
        assert context["callers"] == []
        assert context["same_file"] == []

    def test_context_depth_1(self, fresh_db, sample_functions_with_calls):
        """Depth 1 should include direct relationships only."""
        add_functions(sample_functions_with_calls)
        compute_called_by()

        context = get_function_context("main", depth=1)

        # main -> process_data (direct callee)
        callee_names = [f["function_name"] for f in context["callees"]]
        assert "process_data" in callee_names
        # calculate_sum is not directly called by main
        assert "calculate_sum" not in callee_names

    def test_context_depth_2(self, fresh_db, sample_functions_with_calls):
        """Depth 2 should include indirect relationships."""
        add_functions(sample_functions_with_calls)
        compute_called_by()

        context = get_function_context("main", depth=2)

        # main -> process_data -> calculate_sum
        callee_names = [f["function_name"] for f in context["callees"]]
        assert "process_data" in callee_names
        assert "calculate_sum" in callee_names


class TestGetFunctionByName:
    """Tests for _get_function_by_name helper."""

    def test_get_existing_function(self, fresh_db, sample_functions_with_calls):
        """Should return function when found."""
        add_functions(sample_functions_with_calls)

        func = _get_function_by_name("process_data")

        assert func is not None
        assert func["function_name"] == "process_data"

    def test_get_nonexistent_function(self, fresh_db, sample_functions_with_calls):
        """Should return None when not found."""
        add_functions(sample_functions_with_calls)

        func = _get_function_by_name("nonexistent")

        assert func is None

    def test_get_function_empty_db(self, fresh_db):
        """Should return None for empty database."""
        func = _get_function_by_name("any_function")

        assert func is None
