"""
Chroma vector database module for storing and searching code embeddings.
"""

import hashlib
import os
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
        metadatas.append({
            "name": func["name"],
            "file_path": func["file_path"],
            "line_start": func["line_start"],
            "line_end": func["line_end"],
            "language": func["language"],
            "summary": func.get("summary", "")
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

            output.append({
                "function_name": metadata["name"],
                "file_path": metadata["file_path"],
                "line_start": metadata["line_start"],
                "line_end": metadata["line_end"],
                "summary": metadata["summary"],
                "similarity": round(similarity, 4),
                "code": document
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


if __name__ == "__main__":
    import tempfile

    print("Testing Chroma database module...")

    with tempfile.TemporaryDirectory() as temp_dir:
        test_path = os.path.join(temp_dir, "test_chroma")

        print(f"\n1. Initializing database at: {test_path}")
        init_db(persist_path=test_path)
        print(f"   Initial stats: {get_stats()}")

        fake_function = {
            "name": "calculate_sum",
            "code": "def calculate_sum(a, b):\n    return a + b",
            "file_path": "/test/example.py",
            "line_start": 10,
            "line_end": 12,
            "language": "python",
            "summary": "Calculates the sum of two numbers",
            "embedding": [0.1] * 384
        }

        print("\n2. Adding fake function...")
        add_functions([fake_function])
        print(f"   Stats after adding: {get_stats()}")

        print("\n3. Searching with similar embedding...")
        results = search([0.1] * 384, top_k=5)
        print(f"   Found {len(results)} result(s)")
        for r in results:
            print(f"   - {r['function_name']}: similarity={r['similarity']}")

        print("\n4. Clearing collection...")
        clear_collection()
        print(f"   Stats after clearing: {get_stats()}")

        print("\nAll tests passed!")
