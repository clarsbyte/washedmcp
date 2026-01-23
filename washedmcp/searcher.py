"""Semantic code search using embeddings and vector database."""

from __future__ import annotations

import os
from .config import get_config
from .embedder import embed_query
from .database import init_db, search as db_search, get_stats, get_function_context
from .logging_config import get_logger
from .security import (
    validate_query,
    validate_persist_path,
    sanitize_path,
    SecurityError,
    InputValidationError,
)

logger = get_logger(__name__)


def search_code(
    query: str,
    persist_path: str = None,
    top_k: int = None,
    depth: int = None,
    project_path: str = None
):
    """
    Search for code snippets semantically similar to the query.

    Args:
        query: Natural language search query
        persist_path: Path to the ChromaDB persistence directory.
                      If None and project_path provided, derives from project_path.
        top_k: Number of results to return (uses config default if None)
        depth: If > 0, return expanded context for the best match (uses config default if None)
        project_path: Path to the indexed project (used to derive persist_path)

    Returns:
        List of matching code snippets with metadata and similarity scores,
        or dict with "results" and "context" keys if depth > 0

    Raises:
        InputValidationError: If query is invalid.
        SecurityError: If paths are invalid.
    """
    config = get_config()

    # Use config defaults if not specified
    if top_k is None:
        top_k = config.search.default_top_k
    if depth is None:
        depth = 0  # Default to no context expansion for backward compatibility

    # Validate query
    try:
        query = validate_query(query)
    except InputValidationError as e:
        logger.warning("Invalid query: %s", e)
        raise

    logger.debug("Searching for query: '%s' (top_k=%d, depth=%d)", query, top_k, depth)

    # Derive persist_path from project_path if not explicitly provided
    if persist_path is None and project_path:
        try:
            project_path = sanitize_path(project_path)
        except SecurityError as e:
            logger.warning("Invalid project path: %s", e)
            raise
        persist_path = os.path.join(os.path.abspath(project_path), config.database.default_persist_path)
    elif persist_path is None:
        persist_path = config.database.default_persist_path  # Fallback using config

    # Validate persist_path
    try:
        persist_path = validate_persist_path(persist_path)
    except SecurityError as e:
        logger.warning("Invalid persist path: %s", e)
        raise

    try:
        # Initialize database
        init_db(persist_path=persist_path)

        # Embed the query
        logger.debug("Embedding query...")
        query_embedding = embed_query(query)

        # Search the database (returns formatted results)
        results = db_search(query_embedding, top_k=top_k)

        # If depth > 0, return expanded context
        if depth > 0:
            context = None
            if results:
                best_match = results[0]
                func_name = best_match["function_name"]
                context = get_function_context(func_name, depth)
            return {
                "results": results,
                "context": context
            }

        return results

    except SecurityError:
        raise
    except Exception as e:
        logger.exception("Search error for query '%s'", query)
        if depth > 0:
            return {"results": [], "context": None}
        return []


def is_indexed(persist_path: str = None, project_path: str = None) -> bool:
    """
    Check if the database exists and contains indexed items.

    Args:
        persist_path: Path to the ChromaDB persistence directory.
                      If None and project_path provided, derives from project_path.
        project_path: Path to the indexed project (used to derive persist_path)

    Returns:
        True if database exists and has items, False otherwise
    """
    config = get_config()

    # Derive persist_path from project_path if not explicitly provided
    if persist_path is None and project_path:
        try:
            project_path = sanitize_path(project_path)
        except SecurityError:
            logger.debug("Invalid project path in is_indexed")
            return False
        persist_path = os.path.join(os.path.abspath(project_path), config.database.default_persist_path)
    elif persist_path is None:
        persist_path = config.database.default_persist_path  # Fallback using config

    # Validate persist_path
    try:
        persist_path = validate_persist_path(persist_path)
    except SecurityError:
        logger.debug("Invalid persist path in is_indexed")
        return False

    try:
        if not os.path.exists(persist_path):
            return False

        init_db(persist_path=persist_path)
        stats = get_stats()
        return stats["total_functions"] > 0

    except Exception:
        logger.debug("Exception checking index status for %s", persist_path)
        return False


def search_code_with_context(
    query: str,
    persist_path: str = None,
    top_k: int = None,
    depth: int = None,
    project_path: str = None
) -> dict:
    """
    Search for code with expanded context (callers, callees, same-file functions).

    Args:
        query: Natural language search query
        persist_path: Path to the ChromaDB persistence directory.
                      If None and project_path provided, derives from project_path.
        top_k: Number of results to return (uses config default if None)
        depth: How many hops of relationships to include (uses config default if None)
        project_path: Path to the indexed project (used to derive persist_path)

    Returns:
        Dict with "results" and "context" keys
    """
    config = get_config()

    # Use config defaults if not specified
    if top_k is None:
        top_k = config.search.default_top_k
    if depth is None:
        depth = config.search.default_depth

    results = search_code(query, persist_path, top_k, project_path=project_path)

    context = None
    if results and depth > 0:
        # Get context for the best match
        best_match = results[0]
        func_name = best_match["function_name"]
        context = get_function_context(func_name, depth)

    return {
        "results": results,
        "context": context
    }


if __name__ == "__main__":
    if is_indexed():
        print("Database is indexed. Searching for 'palindrome'...\n")
        results = search_code("palindrome")

        if results:
            print(f"Found {len(results)} results:\n")
            for i, result in enumerate(results, 1):
                print(f"--- Result {i} ---")
                print(f"Function: {result['function_name']}")
                print(f"File: {result['file_path']}")
                print(f"Lines: {result['line_start']}-{result['line_end']}")
                print(f"Summary: {result['summary']}")
                print(f"Similarity: {result['similarity']}")
                print(f"Code:\n{result['code']}")
                print()
        else:
            print("No results found.")
    else:
        print("Not indexed yet")
