"""
Chroma vector database module for storing and searching code embeddings.
"""

from __future__ import annotations

import hashlib
import json
import os
from collections import defaultdict
from typing import Optional

import chromadb
from chromadb.config import Settings

# Global state
_client = None
_collection = None
_persist_path = None


def init_db(persist_path: str = "./.washedmcp/chroma") -> chromadb.Collection:
    """
    Initialize Chroma with persistence and return or create collection named 'codebase'.
    """
    global _client, _collection, _persist_path

    # Create directory if it doesn't exist
    os.makedirs(persist_path, exist_ok=True)

    _persist_path = persist_path
    _client = chromadb.PersistentClient(
        path=persist_path,
        settings=Settings(anonymized_telemetry=False)
    )

    _collection = _client.get_or_create_collection(
        name="codebase",
        metadata={"hnsw:space": "cosine"}
    )

    return _collection


def _get_collection() -> chromadb.Collection:
    """Get the current collection, initializing if needed."""
    global _collection
    if _collection is None:
        init_db()
    return _collection


def add_functions(functions: list[dict]) -> None:
    """
    Add functions to the collection.
    Each function dict should have: name, code, file_path, line_start, line_end, language, summary, embedding
    """
    collection = _get_collection()

    if not functions:
        return

    ids = []
    documents = []
    metadatas = []
    embeddings = []
    seen_ids = set()

    for func in functions:
        # Create unique ID from file_path + name + line_start
        id_string = f"{func['file_path']}:{func['name']}:{func['line_start']}"
        func_id = hashlib.sha256(id_string.encode()).hexdigest()[:32]

        # Skip duplicates
        if func_id in seen_ids:
            continue
        seen_ids.add(func_id)

        ids.append(func_id)
        documents.append(func["code"])
        embeddings.append(func["embedding"])
        # Handle new metadata fields with backward compatibility
        # Store lists as JSON strings since Chroma metadata only supports primitives
        calls = func.get("calls", [])
        imports = func.get("imports", [])
        exported = func.get("exported", False)

        metadatas.append({
            "name": func["name"],
            "file_path": func["file_path"],
            "line_start": func["line_start"],
            "line_end": func["line_end"],
            "language": func["language"],
            "summary": func.get("summary", ""),
            "calls": json.dumps(calls) if calls else "[]",
            "imports": json.dumps(imports) if imports else "[]",
            "exported": exported,
            "called_by": "[]"  # Will be computed later via compute_called_by()
        })

    # Upsert in batches (Chroma max is ~5000)
    BATCH_SIZE = 5000
    for i in range(0, len(ids), BATCH_SIZE):
        batch_end = min(i + BATCH_SIZE, len(ids))
        collection.upsert(
            ids=ids[i:batch_end],
            documents=documents[i:batch_end],
            embeddings=embeddings[i:batch_end],
            metadatas=metadatas[i:batch_end]
        )


def search(query_embedding: list[float], top_k: int = 5) -> list[dict]:
    """
    Search for similar code using the query embedding.
    """
    collection = _get_collection()

    if collection.count() == 0:
        return []

    actual_top_k = min(top_k, collection.count())

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=actual_top_k,
        include=["documents", "metadatas", "distances"]
    )

    output = []

    if results["ids"] and results["ids"][0]:
        for i, doc_id in enumerate(results["ids"][0]):
            metadata = results["metadatas"][0][i]
            document = results["documents"][0][i]
            distance = results["distances"][0][i]

            # Convert cosine distance to similarity (0 = identical, 2 = opposite)
            similarity = 1 - (distance / 2)

            # Parse JSON fields with backward compatibility
            calls = json.loads(metadata.get("calls", "[]")) if metadata.get("calls") else []
            imports = json.loads(metadata.get("imports", "[]")) if metadata.get("imports") else []
            called_by = json.loads(metadata.get("called_by", "[]")) if metadata.get("called_by") else []

            output.append({
                "function_name": metadata["name"],
                "file_path": metadata["file_path"],
                "line_start": metadata["line_start"],
                "line_end": metadata["line_end"],
                "summary": metadata["summary"],
                "similarity": round(similarity, 4),
                "code": document,
                "calls": calls,
                "imports": imports,
                "exported": metadata.get("exported", False),
                "called_by": called_by
            })

    return output


def clear_collection() -> None:
    """Delete all items in the collection."""
    collection = _get_collection()
    all_ids = collection.get()["ids"]
    if all_ids:
        collection.delete(ids=all_ids)


def get_stats() -> dict:
    """Get statistics about the collection."""
    collection = _get_collection()
    return {"total_functions": collection.count()}


def compute_called_by() -> None:
    """
    Compute reverse call relationships for all functions.
    For each function, find all other functions that call it and store as "called_by".
    Should be called at the end of indexing after all functions have been added.
    """
    collection = _get_collection()

    if collection.count() == 0:
        return

    # Get all functions from the collection
    all_data = collection.get(include=["metadatas"])

    if not all_data["ids"]:
        return

    # Build a mapping of function name -> list of callers
    # Note: We use function name as the key for call relationships
    called_by_map = defaultdict(list)

    # First pass: collect all "calls" relationships
    for i, func_id in enumerate(all_data["ids"]):
        metadata = all_data["metadatas"][i]
        caller_name = metadata["name"]

        # Parse the calls list (with backward compatibility)
        calls_json = metadata.get("calls", "[]")
        try:
            calls = json.loads(calls_json) if calls_json else []
        except (json.JSONDecodeError, TypeError):
            calls = []

        # For each function this one calls, record the reverse relationship
        for callee_name in calls:
            called_by_map[callee_name].append(caller_name)

    # Second pass: update each function's called_by field
    for i, func_id in enumerate(all_data["ids"]):
        metadata = all_data["metadatas"][i]
        func_name = metadata["name"]

        # Get the list of functions that call this one
        callers = called_by_map.get(func_name, [])

        # Update the metadata with called_by
        updated_metadata = dict(metadata)
        updated_metadata["called_by"] = json.dumps(callers)

        # Update in collection
        collection.update(
            ids=[func_id],
            metadatas=[updated_metadata]
        )


def get_file_functions(file_path: str) -> list[dict]:
    """
    Return all functions in a given file.

    Args:
        file_path: The path to the file to get functions for.

    Returns:
        List of function dictionaries with metadata and code.
    """
    collection = _get_collection()

    if collection.count() == 0:
        return []

    # Query by file_path metadata
    results = collection.get(
        where={"file_path": file_path},
        include=["documents", "metadatas"]
    )

    output = []
    if results["ids"]:
        for i, func_id in enumerate(results["ids"]):
            metadata = results["metadatas"][i]
            document = results["documents"][i]

            # Parse JSON fields with backward compatibility
            calls = json.loads(metadata.get("calls", "[]")) if metadata.get("calls") else []
            imports = json.loads(metadata.get("imports", "[]")) if metadata.get("imports") else []
            called_by = json.loads(metadata.get("called_by", "[]")) if metadata.get("called_by") else []

            output.append({
                "function_name": metadata["name"],
                "file_path": metadata["file_path"],
                "line_start": metadata["line_start"],
                "line_end": metadata["line_end"],
                "language": metadata["language"],
                "summary": metadata.get("summary", ""),
                "code": document,
                "calls": calls,
                "imports": imports,
                "exported": metadata.get("exported", False),
                "called_by": called_by
            })

    return output


def _get_function_by_name(func_name: str) -> Optional[dict]:
    """
    Helper function to get a function by its name.
    Returns the first match if multiple functions have the same name.
    """
    collection = _get_collection()

    if collection.count() == 0:
        return None

    # Query by name metadata
    results = collection.get(
        where={"name": func_name},
        include=["documents", "metadatas"]
    )

    if results["ids"]:
        metadata = results["metadatas"][0]
        document = results["documents"][0]

        # Parse JSON fields with backward compatibility
        calls = json.loads(metadata.get("calls", "[]")) if metadata.get("calls") else []
        imports = json.loads(metadata.get("imports", "[]")) if metadata.get("imports") else []
        called_by = json.loads(metadata.get("called_by", "[]")) if metadata.get("called_by") else []

        return {
            "function_name": metadata["name"],
            "file_path": metadata["file_path"],
            "line_start": metadata["line_start"],
            "line_end": metadata["line_end"],
            "language": metadata["language"],
            "summary": metadata.get("summary", ""),
            "code": document,
            "calls": calls,
            "imports": imports,
            "exported": metadata.get("exported", False),
            "called_by": called_by
        }

    return None


def get_function_context(func_name: str, depth: int = 1) -> dict:
    """
    Get the context around a function including its relationships.

    Args:
        func_name: The name of the function to get context for.
        depth: How many hops of relationships to include.
               depth=1 means direct relationships only.
               depth=2 means relationships of relationships.

    Returns:
        Dictionary containing:
        - function: The function itself (or None if not found)
        - callees: Functions this function calls
        - callers: Functions that call this function
        - same_file: Other functions in the same file
    """
    # Get the main function
    main_func = _get_function_by_name(func_name)

    result = {
        "function": main_func,
        "callees": [],
        "callers": [],
        "same_file": []
    }

    if main_func is None:
        return result

    # Track visited functions to avoid duplicates
    visited_callees = {func_name}
    visited_callers = {func_name}

    # Get direct callees and callers
    callees_to_process = list(main_func.get("calls", []))
    callers_to_process = list(main_func.get("called_by", []))

    # Process callees
    for current_depth in range(depth):
        next_callees = []
        for callee_name in callees_to_process:
            if callee_name not in visited_callees:
                visited_callees.add(callee_name)
                callee_func = _get_function_by_name(callee_name)
                if callee_func:
                    result["callees"].append(callee_func)
                    # If we need to go deeper, add this function's callees
                    if current_depth < depth - 1:
                        next_callees.extend(callee_func.get("calls", []))
        callees_to_process = next_callees

    # Process callers
    for current_depth in range(depth):
        next_callers = []
        for caller_name in callers_to_process:
            if caller_name not in visited_callers:
                visited_callers.add(caller_name)
                caller_func = _get_function_by_name(caller_name)
                if caller_func:
                    result["callers"].append(caller_func)
                    # If we need to go deeper, add this function's callers
                    if current_depth < depth - 1:
                        next_callers.extend(caller_func.get("called_by", []))
        callers_to_process = next_callers

    # Get functions in the same file
    same_file_funcs = get_file_functions(main_func["file_path"])
    result["same_file"] = [
        f for f in same_file_funcs
        if f["function_name"] != func_name
    ]

    return result


if __name__ == "__main__":
    import tempfile

    print("Testing Chroma database module...")

    with tempfile.TemporaryDirectory() as temp_dir:
        test_path = os.path.join(temp_dir, "test_chroma")

        print(f"\n1. Initializing database at: {test_path}")
        init_db(persist_path=test_path)
        print(f"   Initial stats: {get_stats()}")

        # Test with new metadata fields
        fake_functions = [
            {
                "name": "calculate_sum",
                "code": "def calculate_sum(a, b):\n    return a + b",
                "file_path": "/test/example.py",
                "line_start": 10,
                "line_end": 12,
                "language": "python",
                "summary": "Calculates the sum of two numbers",
                "embedding": [0.1] * 384,
                "calls": [],
                "imports": ["math"],
                "exported": True
            },
            {
                "name": "process_data",
                "code": "def process_data(data):\n    total = calculate_sum(data[0], data[1])\n    return total",
                "file_path": "/test/example.py",
                "line_start": 15,
                "line_end": 18,
                "language": "python",
                "summary": "Processes data and calculates sum",
                "embedding": [0.2] * 384,
                "calls": ["calculate_sum"],
                "imports": [],
                "exported": True
            },
            {
                "name": "main",
                "code": "def main():\n    result = process_data([1, 2])\n    print(result)",
                "file_path": "/test/main.py",
                "line_start": 1,
                "line_end": 4,
                "language": "python",
                "summary": "Main entry point",
                "embedding": [0.3] * 384,
                "calls": ["process_data"],
                "imports": [],
                "exported": False
            }
        ]

        print("\n2. Adding fake functions with call relationships...")
        add_functions(fake_functions)
        print(f"   Stats after adding: {get_stats()}")

        print("\n3. Computing called_by relationships...")
        compute_called_by()
        print("   Done computing reverse relationships")

        print("\n4. Testing get_file_functions...")
        file_funcs = get_file_functions("/test/example.py")
        print(f"   Found {len(file_funcs)} functions in /test/example.py")
        for f in file_funcs:
            print(f"   - {f['function_name']}: calls={f['calls']}, called_by={f['called_by']}")

        print("\n5. Testing get_function_context...")
        context = get_function_context("process_data", depth=1)
        print(f"   Function: {context['function']['function_name'] if context['function'] else 'None'}")
        print(f"   Callees: {[f['function_name'] for f in context['callees']]}")
        print(f"   Callers: {[f['function_name'] for f in context['callers']]}")
        print(f"   Same file: {[f['function_name'] for f in context['same_file']]}")

        print("\n6. Testing get_function_context with depth=2...")
        context2 = get_function_context("main", depth=2)
        print(f"   Function: {context2['function']['function_name'] if context2['function'] else 'None'}")
        print(f"   Callees (depth=2): {[f['function_name'] for f in context2['callees']]}")

        print("\n7. Searching with similar embedding...")
        results = search([0.1] * 384, top_k=5)
        print(f"   Found {len(results)} result(s)")
        for r in results:
            print(f"   - {r['function_name']}: similarity={r['similarity']}, calls={r['calls']}, exported={r['exported']}")

        print("\n8. Testing backward compatibility (function without new fields)...")
        old_function = {
            "name": "old_func",
            "code": "def old_func(): pass",
            "file_path": "/test/old.py",
            "line_start": 1,
            "line_end": 1,
            "language": "python",
            "summary": "Old function without new fields",
            "embedding": [0.4] * 384
            # Note: no calls, imports, or exported fields
        }
        add_functions([old_function])
        old_context = get_function_context("old_func")
        print(f"   Old function calls: {old_context['function']['calls']}")
        print(f"   Old function exported: {old_context['function']['exported']}")

        print("\n9. Clearing collection...")
        clear_collection()
        print(f"   Stats after clearing: {get_stats()}")

        print("\nAll tests passed!")
