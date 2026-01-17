"""
Local Embeddings Module for Code Embeddings

Uses sentence-transformers with all-MiniLM-L6-v2 model.
Runs locally - no API needed, free, fast.
"""

from typing import List
from sentence_transformers import SentenceTransformer

# Model configuration
MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSIONS = 384

# Lazy model initialization
_model = None


def _get_model() -> SentenceTransformer:
    """Get or create the model lazily."""
    global _model
    if _model is None:
        print("Loading embedding model (first time only)...")
        _model = SentenceTransformer(MODEL_NAME)
        print("Model loaded.")
    return _model


def embed_code(code: str) -> List[float]:
    """
    Generate an embedding for a single code snippet.

    Args:
        code: The code snippet to embed.

    Returns:
        A list of floats representing the embedding vector (384 dimensions).
    """
    if not code or not code.strip():
        raise ValueError("Code snippet cannot be empty")

    model = _get_model()
    embedding = model.encode(code, convert_to_numpy=True)
    return embedding.tolist()


def embed_batch(codes: List[str]) -> List[List[float]]:
    """
    Generate embeddings for multiple code snippets efficiently.

    Args:
        codes: List of code snippets to embed.

    Returns:
        List of embedding vectors, one for each input code snippet.
    """
    if not codes:
        raise ValueError("Codes list cannot be empty")

    for i, code in enumerate(codes):
        if not code or not code.strip():
            raise ValueError(f"Code snippet at index {i} cannot be empty")

    model = _get_model()
    embeddings = model.encode(codes, convert_to_numpy=True, show_progress_bar=True)
    return [emb.tolist() for emb in embeddings]


def embed_query(query: str) -> List[float]:
    """
    Generate an embedding for a search query.

    Args:
        query: The search query to embed.

    Returns:
        A list of floats representing the embedding vector (384 dimensions).
    """
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    model = _get_model()
    embedding = model.encode(query, convert_to_numpy=True)
    return embedding.tolist()


if __name__ == "__main__":
    # Simple test
    test_code = "def hello(): return 'world'"
    print(f"Testing embedding for: {test_code}")

    embedding = embed_code(test_code)
    print(f"Embedding length: {len(embedding)}")
    print(f"Expected length: {EMBEDDING_DIMENSIONS}")
    print(f"Test passed: {len(embedding) == EMBEDDING_DIMENSIONS}")
