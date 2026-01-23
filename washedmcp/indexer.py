"""
Indexer module - orchestrates the codebase indexing process.

Walks directory tree, parses files, embeds code, summarizes,
and stores everything in the vector database.
"""

import os
from typing import Dict, List, Any

from .parser import extract_functions, get_supported_extensions
from .embedder import embed_batch
from .summarizer import summarize_batch
from .database import init_db, add_functions, clear_collection, get_stats, compute_called_by
from .config import get_config
from .logging_config import get_logger
from .security import (
    validate_path,
    validate_persist_path,
    is_safe_to_index,
    sanitize_path,
    SecurityError,
    PathTraversalError,
    MAX_FILE_SIZE_MB,
)

logger = get_logger(__name__)


def index_codebase(
    path: str,
    persist_path: str = None,
    skip_summarize: bool = None,  # None = use config default
    max_file_size_mb: float = MAX_FILE_SIZE_MB
) -> dict:
    """
    Index a codebase by parsing, embedding, and storing all functions.

    Args:
        path: Path to the codebase directory to index
        persist_path: Path where ChromaDB will persist data.
                      If None, defaults to <path>/.washedmcp/chroma
        skip_summarize: If True, skip summarization step (use empty strings).
                        If None, uses config default (typically True)
        max_file_size_mb: Maximum file size in MB to index (default: 10MB)

    Returns:
        Dict with status, files_processed, functions_indexed, and path
    """
    config = get_config()

    # Use config default for skip_summarize if not specified
    if skip_summarize is None:
        skip_summarize = config.indexer.skip_summarize_default

    # Sanitize and validate the input path
    try:
        path = sanitize_path(path)
    except SecurityError as e:
        logger.error("Invalid path provided: %s", e)
        return {
            "status": "error",
            "error": f"Invalid path: {e}",
            "files_processed": 0,
            "functions_indexed": 0,
            "path": path,
        }

    # Convert to absolute path
    abs_path = os.path.abspath(path)

    # Verify the path exists and is a directory
    if not os.path.exists(abs_path):
        logger.error("Path does not exist: %s", abs_path)
        return {
            "status": "error",
            "error": f"Path does not exist: {abs_path}",
            "files_processed": 0,
            "functions_indexed": 0,
            "path": abs_path,
        }

    if not os.path.isdir(abs_path):
        logger.error("Path is not a directory: %s", abs_path)
        return {
            "status": "error",
            "error": f"Path is not a directory: {abs_path}",
            "files_processed": 0,
            "functions_indexed": 0,
            "path": abs_path,
        }

    # Default persist_path: store index inside the indexed project
    if persist_path is None:
        persist_path = os.path.join(abs_path, config.database.default_persist_path)

    # Validate persist_path
    try:
        persist_path = validate_persist_path(persist_path)
    except SecurityError as e:
        logger.error("Invalid persist path: %s", e)
        return {
            "status": "error",
            "error": f"Invalid persist path: {e}",
            "files_processed": 0,
            "functions_indexed": 0,
            "path": abs_path,
        }

    logger.info("Starting indexing of: %s", abs_path)
    logger.info("Database path: %s", persist_path)

    # Step 1: Initialize database
    logger.info("Initializing database...")
    init_db(persist_path)

    # Step 2: Clear existing collection
    logger.info("Clearing existing collection...")
    clear_collection()

    # Step 3: Get supported extensions
    supported_extensions = get_supported_extensions()
    logger.debug("Supported extensions: %s", supported_extensions)

    # Step 4: Walk directory and collect all functions
    all_functions: List[Dict[str, Any]] = []
    files_processed = 0
    files_with_errors = 0
    files_skipped_security = 0

    logger.info("Scanning files...")

    skip_dirs = config.indexer.skip_dirs
    for root, dirs, files in os.walk(abs_path, followlinks=False):
        # Skip directories we don't want to index
        dirs[:] = [d for d in dirs if d not in skip_dirs]

        # Also skip symlinked directories to prevent loops
        dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(root, d))]

        for filename in files:
            # Check if file has a supported extension
            _, ext = os.path.splitext(filename)
            if ext not in supported_extensions:
                continue

            filepath = os.path.join(root, filename)

            # Security check: validate file is safe to index
            is_safe, reason = is_safe_to_index(filepath, abs_path, max_file_size_mb)
            if not is_safe:
                logger.debug("Skipping file (security): %s - %s", filepath, reason)
                files_skipped_security += 1
                continue

            try:
                logger.debug("Parsing: %s", filepath)
                functions = extract_functions(filepath, max_file_size_mb)

                if functions:
                    all_functions.extend(functions)
                    logger.debug("Found %d function(s) in %s", len(functions), filepath)

                files_processed += 1

            except Exception as e:
                logger.warning("Error parsing %s: %s", filepath, e)
                files_with_errors += 1
                continue

    logger.info("Files processed: %d", files_processed)
    if files_with_errors > 0:
        logger.warning("Files with errors: %d", files_with_errors)
    if files_skipped_security > 0:
        logger.info("Files skipped (security): %d", files_skipped_security)
    logger.info("Total functions found: %d", len(all_functions))

    if not all_functions:
        logger.info("No functions found to index.")
        return {
            "status": "success",
            "files_processed": files_processed,
            "functions_indexed": 0,
            "path": abs_path,
        }

    # Step 5: Batch embed all functions
    logger.info("Embedding functions...")

    try:
        # Extract code from all functions for embedding
        codes = [f["code"] for f in all_functions]
        embeddings = embed_batch(codes)

        # Add embeddings to function dicts
        for func, embedding in zip(all_functions, embeddings):
            func["embedding"] = embedding

        logger.info("Embedded %d functions", len(embeddings))

    except Exception as e:
        logger.exception("Error during embedding")
        return {
            "status": "error",
            "error": str(e),
            "files_processed": files_processed,
            "functions_indexed": 0,
            "path": abs_path,
        }

    # Step 6: Batch summarize all functions
    if skip_summarize:
        logger.info("Skipping summarization (skip_summarize=True)")
        for func in all_functions:
            func["summary"] = ""
    else:
        logger.info("Summarizing functions...")
        try:
            codes = [f["code"] for f in all_functions]
            summaries = summarize_batch(codes)

            for func, summary in zip(all_functions, summaries):
                func["summary"] = summary

            logger.info("Summarized %d functions", len(summaries))

        except Exception as e:
            logger.warning("Error during summarization: %s. Falling back to empty summaries.", e)
            for func in all_functions:
                func["summary"] = ""

    # Step 7: Store all functions in database
    logger.info("Storing functions in database...")

    try:
        add_functions(all_functions)
        logger.info("Stored %d functions", len(all_functions))

    except Exception as e:
        logger.exception("Error storing functions")
        return {
            "status": "error",
            "error": str(e),
            "files_processed": files_processed,
            "functions_indexed": 0,
            "path": abs_path,
        }

    # Step 7.5: Compute reverse call relationships
    logger.info("Computing call relationships...")
    compute_called_by()

    # Step 8: Get final stats and return
    stats = get_stats()
    logger.debug("Database stats: %s", stats)

    result = {
        "status": "success",
        "files_processed": files_processed,
        "functions_indexed": len(all_functions),
        "path": abs_path,
    }

    logger.info("Indexing complete! Indexed %d functions from %d files", len(all_functions), files_processed)

    return result


if __name__ == "__main__":
    import sys

    # Index the test codebase or path provided via command line
    if len(sys.argv) > 1:
        test_path = sys.argv[1]
    else:
        # Default to tests/test_codebase relative to this file
        test_path = os.path.join(os.path.dirname(__file__), "..", "tests", "test_codebase")

    print("=" * 60)
    print("CODEBASE INDEXER")
    print("=" * 60)
    print()

    results = index_codebase(test_path)

    print()
    print("=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    for key, value in results.items():
        print(f"  {key}: {value}")
