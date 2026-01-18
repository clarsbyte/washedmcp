"""Semantic code search using embeddings and vector database."""

import os
from src.embedder import embed_query
from src.database import init_db, search as db_search, get_stats, get_function_context


def search_code(
    query: str,
    persist_path: str = "./.washedmcp/chroma",
    top_k: int = 5,
    depth: int = 0
) -> list[dict] | dict:
    """
    Search for code snippets semantically similar to the query.

    Args:
        query: Natural language search query
        persist_path: Path to the ChromaDB persistence directory
        top_k: Number of results to return
        depth: If > 0, return expanded context for the best match

    Returns:
        List of matching code snippets with metadata and similarity scores,
        or dict with "results" and "context" keys if depth > 0
    """
    try:
        # Initialize database
        init_db(persist_path=persist_path)

        # Embed the query
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

    except Exception as e:
        print(f"Search error: {e}")
        if depth > 0:
            return {"results": [], "context": None}
        return []


def is_indexed(persist_path: str = "./.washedmcp/chroma") -> bool:
    """
    Check if the database exists and contains indexed items.

    Args:
        persist_path: Path to the ChromaDB persistence directory

    Returns:
        True if database exists and has items, False otherwise
    """
    try:
        if not os.path.exists(persist_path):
            return False

        init_db(persist_path=persist_path)
        stats = get_stats()
        return stats["total_functions"] > 0

    except Exception:
        return False


def search_code_with_context(
    query: str,
    persist_path: str = "./.washedmcp/chroma",
    top_k: int = 5,
    depth: int = 1
) -> dict:
    """
    Search for code with expanded context (callers, callees, same-file functions).

    Args:
        query: Natural language search query
        persist_path: Path to the ChromaDB persistence directory
        top_k: Number of results to return
        depth: How many hops of relationships to include

    Returns:
        Dict with "results" and "context" keys
    """
    results = search_code(query, persist_path, top_k)

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
