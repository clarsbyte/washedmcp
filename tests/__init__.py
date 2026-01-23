"""
WashedMCP Test Suite

This package contains unit tests for the WashedMCP semantic code search system.

Test modules:
- test_parser: Tests for code parsing and function extraction
- test_embedder: Tests for embedding generation
- test_database: Tests for ChromaDB operations
- test_searcher: Tests for semantic search
- test_indexer: Tests for codebase indexing
- test_toon_formatter: Tests for output formatting

Run all tests:
    pytest

Run with coverage:
    pytest --cov=washedmcp --cov-report=html

Run specific test file:
    pytest tests/test_parser.py

Run specific test class:
    pytest tests/test_parser.py::TestExtractFunctionsPython

Run specific test:
    pytest tests/test_parser.py::TestExtractFunctionsPython::test_extract_simple_function
"""
