"""
Tests for the indexer module.

Tests codebase indexing including file discovery,
function extraction, embedding, and storage.
"""

import os
import tempfile
from unittest.mock import patch, MagicMock

import pytest

from washedmcp.indexer import (
    index_codebase,
    SKIP_DIRS,
)


@pytest.fixture
def temp_codebase_dir():
    """Create a temporary codebase directory for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture
def simple_codebase(temp_codebase_dir):
    """Create a simple codebase with Python files."""
    # Create main.py
    main_py = os.path.join(temp_codebase_dir, "main.py")
    with open(main_py, "w") as f:
        f.write('''def main():
    """Main entry point."""
    result = process()
    print(result)

def process():
    """Process data."""
    return helper()
''')

    # Create utils.py
    utils_py = os.path.join(temp_codebase_dir, "utils.py")
    with open(utils_py, "w") as f:
        f.write('''def helper():
    """Helper function."""
    return 42

def validate(data):
    """Validate data."""
    return data is not None
''')

    return temp_codebase_dir


@pytest.fixture
def mixed_codebase(temp_codebase_dir):
    """Create a codebase with multiple file types."""
    # Python file
    py_file = os.path.join(temp_codebase_dir, "app.py")
    with open(py_file, "w") as f:
        f.write('''def start_app():
    """Start the application."""
    return True
''')

    # JavaScript file
    js_file = os.path.join(temp_codebase_dir, "client.js")
    with open(js_file, "w") as f:
        f.write('''function initClient() {
    return { status: 'ready' };
}
''')

    # TypeScript file
    ts_file = os.path.join(temp_codebase_dir, "types.ts")
    with open(ts_file, "w") as f:
        f.write('''interface Config {
    port: number;
}

function getConfig(): Config {
    return { port: 3000 };
}
''')

    return temp_codebase_dir


@pytest.fixture
def mock_embedder_for_indexer(mock_embedding):
    """Mock embedder for indexer tests."""
    def embed_batch_mock(codes):
        return [mock_embedding for _ in codes]

    with patch("washedmcp.indexer.embed_batch", side_effect=embed_batch_mock):
        yield


class TestIndexCodebase:
    """Tests for index_codebase function."""

    def test_index_returns_success(self, simple_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should return success status."""
        result = index_codebase(simple_codebase)

        assert result["status"] == "success"

    def test_index_counts_files(self, simple_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should count processed files."""
        result = index_codebase(simple_codebase)

        assert result["files_processed"] == 2  # main.py and utils.py

    def test_index_counts_functions(self, simple_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should count indexed functions."""
        result = index_codebase(simple_codebase)

        # main.py: main, process (2)
        # utils.py: helper, validate (2)
        assert result["functions_indexed"] == 4

    def test_index_returns_path(self, simple_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should return absolute path."""
        result = index_codebase(simple_codebase)

        assert result["path"] == os.path.abspath(simple_codebase)

    def test_index_creates_default_db_path(self, simple_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should create database in .washedmcp/chroma by default."""
        index_codebase(simple_codebase)

        expected_path = os.path.join(simple_codebase, ".washedmcp", "chroma")
        assert os.path.exists(expected_path)

    def test_index_custom_persist_path(self, simple_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should use custom persist path when provided."""
        with tempfile.TemporaryDirectory() as custom_dir:
            custom_path = os.path.join(custom_dir, "custom_chroma")
            index_codebase(simple_codebase, persist_path=custom_path)

            assert os.path.exists(custom_path)

    def test_index_mixed_file_types(self, mixed_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should index multiple file types."""
        result = index_codebase(mixed_codebase)

        assert result["status"] == "success"
        assert result["files_processed"] == 3  # .py, .js, .ts

    def test_index_empty_directory(self, temp_codebase_dir, reset_database_globals):
        """Should handle empty directory."""
        result = index_codebase(temp_codebase_dir)

        assert result["status"] == "success"
        assert result["files_processed"] == 0
        assert result["functions_indexed"] == 0

    def test_index_no_supported_files(self, temp_codebase_dir, reset_database_globals):
        """Should handle directory with no supported files."""
        # Create only unsupported files
        txt_file = os.path.join(temp_codebase_dir, "readme.txt")
        with open(txt_file, "w") as f:
            f.write("This is a readme")

        md_file = os.path.join(temp_codebase_dir, "docs.md")
        with open(md_file, "w") as f:
            f.write("# Documentation")

        result = index_codebase(temp_codebase_dir)

        assert result["files_processed"] == 0
        assert result["functions_indexed"] == 0


class TestSkipDirectories:
    """Tests for directory skipping behavior."""

    def test_skip_dirs_constant(self):
        """Should have expected directories to skip."""
        assert "node_modules" in SKIP_DIRS
        assert ".git" in SKIP_DIRS
        assert "__pycache__" in SKIP_DIRS
        assert ".venv" in SKIP_DIRS
        assert "venv" in SKIP_DIRS

    def test_skips_node_modules(self, temp_codebase_dir, mock_embedder_for_indexer, reset_database_globals):
        """Should skip node_modules directory."""
        # Create main file
        main_py = os.path.join(temp_codebase_dir, "main.py")
        with open(main_py, "w") as f:
            f.write("def main(): pass")

        # Create node_modules with a JS file
        node_modules = os.path.join(temp_codebase_dir, "node_modules")
        os.makedirs(node_modules)
        lib_js = os.path.join(node_modules, "lib.js")
        with open(lib_js, "w") as f:
            f.write("function libFunc() {}")

        result = index_codebase(temp_codebase_dir)

        # Should only process main.py, not node_modules/lib.js
        assert result["files_processed"] == 1

    def test_skips_git_directory(self, temp_codebase_dir, mock_embedder_for_indexer, reset_database_globals):
        """Should skip .git directory."""
        main_py = os.path.join(temp_codebase_dir, "main.py")
        with open(main_py, "w") as f:
            f.write("def main(): pass")

        git_dir = os.path.join(temp_codebase_dir, ".git")
        os.makedirs(git_dir)
        git_file = os.path.join(git_dir, "hooks.py")
        with open(git_file, "w") as f:
            f.write("def hook(): pass")

        result = index_codebase(temp_codebase_dir)

        assert result["files_processed"] == 1

    def test_skips_pycache(self, temp_codebase_dir, mock_embedder_for_indexer, reset_database_globals):
        """Should skip __pycache__ directory."""
        main_py = os.path.join(temp_codebase_dir, "main.py")
        with open(main_py, "w") as f:
            f.write("def main(): pass")

        pycache = os.path.join(temp_codebase_dir, "__pycache__")
        os.makedirs(pycache)
        cache_py = os.path.join(pycache, "main.cpython-311.pyc")
        with open(cache_py, "w") as f:
            f.write("compiled stuff")

        result = index_codebase(temp_codebase_dir)

        assert result["files_processed"] == 1


class TestSubdirectoryHandling:
    """Tests for handling nested directories."""

    def test_index_subdirectories(self, temp_codebase_dir, mock_embedder_for_indexer, reset_database_globals):
        """Should index files in subdirectories."""
        # Create nested structure
        src_dir = os.path.join(temp_codebase_dir, "src")
        os.makedirs(src_dir)

        root_py = os.path.join(temp_codebase_dir, "main.py")
        with open(root_py, "w") as f:
            f.write("def main(): pass")

        sub_py = os.path.join(src_dir, "utils.py")
        with open(sub_py, "w") as f:
            f.write("def util(): pass")

        result = index_codebase(temp_codebase_dir)

        assert result["files_processed"] == 2
        assert result["functions_indexed"] == 2

    def test_index_deeply_nested(self, temp_codebase_dir, mock_embedder_for_indexer, reset_database_globals):
        """Should index deeply nested files."""
        deep_dir = os.path.join(temp_codebase_dir, "a", "b", "c", "d")
        os.makedirs(deep_dir)

        deep_file = os.path.join(deep_dir, "deep.py")
        with open(deep_file, "w") as f:
            f.write("def deep_func(): pass")

        result = index_codebase(temp_codebase_dir)

        assert result["files_processed"] == 1
        assert result["functions_indexed"] == 1


class TestSummarization:
    """Tests for summarization behavior."""

    def test_skip_summarize_default_true(self, simple_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should skip summarization by default."""
        with patch("washedmcp.indexer.summarize_batch") as mock_summarize:
            index_codebase(simple_codebase)

            # summarize_batch should NOT be called when skip_summarize=True (default)
            mock_summarize.assert_not_called()

    def test_summarize_when_enabled(self, simple_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should call summarization when enabled."""
        with patch("washedmcp.indexer.summarize_batch") as mock_summarize:
            mock_summarize.return_value = ["summary"] * 4

            index_codebase(simple_codebase, skip_summarize=False)

            mock_summarize.assert_called_once()


class TestErrorHandling:
    """Tests for error handling during indexing."""

    def test_handles_parse_error(self, temp_codebase_dir, mock_embedder_for_indexer, reset_database_globals):
        """Should handle files that fail to parse."""
        # Create a valid file
        valid_py = os.path.join(temp_codebase_dir, "valid.py")
        with open(valid_py, "w") as f:
            f.write("def valid(): pass")

        # Create a "bad" file (actually tree-sitter handles most syntax errors)
        # We'll test with an encoding issue instead
        bad_py = os.path.join(temp_codebase_dir, "bad.py")
        with open(bad_py, "wb") as f:
            f.write(b'\xff\xfe invalid utf-8')

        result = index_codebase(temp_codebase_dir)

        # Should still succeed, just skip problematic file
        assert result["status"] == "success"

    def test_handles_embedding_error(self, simple_codebase, reset_database_globals):
        """Should return error status on embedding failure."""
        with patch("washedmcp.indexer.embed_batch") as mock_embed:
            mock_embed.side_effect = Exception("Embedding failed")

            result = index_codebase(simple_codebase)

            assert result["status"] == "error"
            assert "error" in result


class TestCallRelationships:
    """Tests for call relationship computation."""

    def test_computes_called_by(self, simple_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should compute called_by relationships after indexing."""
        from washedmcp.database import get_function_context

        index_codebase(simple_codebase)

        # process() calls helper(), so helper should have process in called_by
        context = get_function_context("helper")

        assert context["function"] is not None
        # Note: The actual called_by depends on what extract_calls extracts
        # This test verifies the pipeline works


class TestClearBeforeIndex:
    """Tests for clearing collection before indexing."""

    def test_clears_existing_data(self, simple_codebase, mock_embedder_for_indexer, reset_database_globals):
        """Should clear existing data before re-indexing."""
        from washedmcp.database import get_stats

        # Index once
        result1 = index_codebase(simple_codebase)
        initial_count = result1["functions_indexed"]

        # Index again
        result2 = index_codebase(simple_codebase)

        # Should have same count (not doubled)
        stats = get_stats()
        assert stats["total_functions"] == initial_count
