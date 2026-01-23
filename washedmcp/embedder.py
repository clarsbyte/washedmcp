"""
Local Embeddings Module for Code Embeddings

Uses sentence-transformers with all-MiniLM-L6-v2 model.
Runs locally - no API needed, free, fast.
"""

from typing import List
from sentence_transformers import SentenceTransformer

from .config import get_config
from .logging_config import get_logger

logger = get_logger(__name__)

# Lazy model initialization
_model = None
_current_model_name = None


def _get_model() -> SentenceTransformer:
    """Get or create the model lazily."""
    global _model, _current_model_name

    config = get_config()
    model_name = config.embedder.model_name

    # Reinitialize if model name changed
    if _model is None or _current_model_name != model_name:
        logger.info("Downloading embedding model '%s' (~100MB, first time only)...", model_name)
        logger.info("This may take a minute on slow connections...")
        _model = SentenceTransformer(model_name)
        _current_model_name = model_name
        logger.info("Embedding model ready")

    return _model


def get_embedding_dimensions() -> int:
    """Get the expected embedding dimensions from config."""
    return get_config().embedder.embedding_dimensions


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

    config = get_config()
    model = _get_model()
    embeddings = model.encode(
        codes,
        convert_to_numpy=True,
        show_progress_bar=config.embedder.show_progress_bar
    )
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
    expected_dim = get_embedding_dimensions()
    print(f"Embedding length: {len(embedding)}")
    print(f"Expected length: {expected_dim}")
    print(f"Test passed: {len(embedding) == expected_dim}")
