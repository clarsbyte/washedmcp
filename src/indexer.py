"""
Indexer module - orchestrates the codebase indexing process.

Walks directory tree, parses files, embeds code, summarizes,
and stores everything in the vector database.
"""

import os
from typing import Dict, List, Any

from src.parser import extract_functions, get_supported_extensions
from src.embedder import embed_batch
from src.summarizer import summarize_batch
from src.database import init_db, add_functions, clear_collection, get_stats


# Directories to skip during indexing
SKIP_DIRS = {
    "node_modules",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    ".env",
    "dist",
    "build",
}


def index_codebase(
    path: str,
    persist_path: str = "./.washedmcp/chroma",
    skip_summarize: bool = True  # Default True = no API needed
) -> dict:
    """
    Index a codebase by parsing, embedding, and storing all functions.

    Args:
        path: Path to the codebase directory to index
        persist_path: Path where ChromaDB will persist data
        skip_summarize: If True, skip summarization step (use empty strings)

    Returns:
        Dict with status, files_processed, functions_indexed, and path
    """
    # Convert to absolute path
    abs_path = os.path.abspath(path)

    print(f"Starting indexing of: {abs_path}")
    print(f"Database path: {persist_path}")
    print("-" * 50)

    # Step 1: Initialize database
    print("Initializing database...")
    init_db(persist_path)

    # Step 2: Clear existing collection
    print("Clearing existing collection...")
    clear_collection()

    # Step 3: Get supported extensions
    supported_extensions = get_supported_extensions()
    print(f"Supported extensions: {supported_extensions}")
    print("-" * 50)

    # Step 4: Walk directory and collect all functions
    all_functions: List[Dict[str, Any]] = []
    files_processed = 0
    files_with_errors = 0

    print("Scanning files...")

    for root, dirs, files in os.walk(abs_path):
        # Skip directories we don't want to index
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for filename in files:
            # Check if file has a supported extension
            _, ext = os.path.splitext(filename)
            if ext not in supported_extensions:
                continue

            filepath = os.path.join(root, filename)

            try:
                print(f"  Parsing: {filepath}")
                functions = extract_functions(filepath)

                if functions:
                    all_functions.extend(functions)
                    print(f"    Found {len(functions)} function(s)")

                files_processed += 1

            except Exception as e:
                print(f"    Error parsing {filepath}: {e}")
                files_with_errors += 1
                continue

    print("-" * 50)
    print(f"Files processed: {files_processed}")
    print(f"Files with errors: {files_with_errors}")
    print(f"Total functions found: {len(all_functions)}")

    if not all_functions:
        print("No functions found to index.")
        return {
            "status": "success",
            "files_processed": files_processed,
            "functions_indexed": 0,
            "path": abs_path,
        }

    # Step 5: Batch embed all functions
    print("-" * 50)
    print("Embedding functions...")

    try:
        # Extract code from all functions for embedding
        codes = [f["code"] for f in all_functions]
        embeddings = embed_batch(codes)

        # Add embeddings to function dicts
        for func, embedding in zip(all_functions, embeddings):
            func["embedding"] = embedding

        print(f"  Embedded {len(embeddings)} functions")

    except Exception as e:
        print(f"Error during embedding: {e}")
        return {
            "status": "error",
            "error": str(e),
            "files_processed": files_processed,
            "functions_indexed": 0,
            "path": abs_path,
        }

    # Step 6: Batch summarize all functions
    print("-" * 50)

    if skip_summarize:
        print("Skipping summarization (skip_summarize=True)...")
        for func in all_functions:
            func["summary"] = ""
    else:
        print("Summarizing functions...")
        try:
            codes = [f["code"] for f in all_functions]
            summaries = summarize_batch(codes)

            for func, summary in zip(all_functions, summaries):
                func["summary"] = summary

            print(f"  Summarized {len(summaries)} functions")

        except Exception as e:
            print(f"Error during summarization: {e}")
            # Fall back to empty summaries on error
            print("  Falling back to empty summaries...")
            for func in all_functions:
                func["summary"] = ""

    # Step 7: Store all functions in database
    print("-" * 50)
    print("Storing functions in database...")

    try:
        add_functions(all_functions)
        print(f"  Stored {len(all_functions)} functions")

    except Exception as e:
        print(f"Error storing functions: {e}")
        return {
            "status": "error",
            "error": str(e),
            "files_processed": files_processed,
            "functions_indexed": 0,
            "path": abs_path,
        }

    # Step 8: Get final stats and return
    print("-" * 50)
    stats = get_stats()
    print(f"Database stats: {stats}")

    result = {
        "status": "success",
        "files_processed": files_processed,
        "functions_indexed": len(all_functions),
        "path": abs_path,
    }

    print("-" * 50)
    print("Indexing complete!")
    print(f"Result: {result}")

    return result


if __name__ == "__main__":
    # Index the test codebase
    test_path = "/Users/pratham/Wash/washedmcp/tests/test_codebase"

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
