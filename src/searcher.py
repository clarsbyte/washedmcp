"""Semantic code search using embeddings and vector database."""

import os
from src.embedder import embed_query
from src.database import init_db, search as db_search, get_stats


def search_code(
    query: str,
    persist_path: str = "./.washedmcp/chroma",
    top_k: int = 5
) -> list[dict]:
    """
    Search for code snippets semantically similar to the query.

    Args:
        query: Natural language search query
        persist_path: Path to the ChromaDB persistence directory
        top_k: Number of results to return

    Returns:
        List of matching code snippets with metadata and similarity scores
    """
    try:
        # Initialize database
        init_db(persist_path=persist_path)

        # Embed the query
        query_embedding = embed_query(query)

        # Search the database (returns formatted results)
        results = db_search(query_embedding, top_k=top_k)

        return results

    except Exception as e:
        print(f"Search error: {e}")
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
