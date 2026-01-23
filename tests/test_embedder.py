"""
Tests for the embedder module.

Tests embedding generation with mocked model to avoid
loading the actual sentence-transformers model during tests.
"""

import pytest
from unittest.mock import MagicMock, patch
import numpy as np

from washedmcp.embedder import (
    embed_code,
    embed_batch,
    embed_query,
    EMBEDDING_DIMENSIONS,
    MODEL_NAME,
    _get_model,
)


class TestEmbeddingDimensions:
    """Tests for embedding dimension constants."""

    def test_embedding_dimensions_value(self):
        """Should have correct embedding dimensions."""
        assert EMBEDDING_DIMENSIONS == 384

    def test_model_name_value(self):
        """Should have correct model name."""
        assert MODEL_NAME == "all-MiniLM-L6-v2"


class TestEmbedCode:
    """Tests for embed_code function."""

    def test_embed_code_returns_list(self, mock_embedder):
        """Should return a list of floats."""
        result = embed_code("def hello(): pass")

        assert isinstance(result, list)

    def test_embed_code_correct_dimensions(self, mock_embedder, mock_embedding):
        """Should return embedding with correct dimensions."""
        result = embed_code("def hello(): pass")

        assert len(result) == EMBEDDING_DIMENSIONS

    def test_embed_code_empty_string_raises(self):
        """Should raise ValueError for empty code."""
        with pytest.raises(ValueError, match="cannot be empty"):
            embed_code("")

    def test_embed_code_whitespace_only_raises(self):
        """Should raise ValueError for whitespace-only code."""
        with pytest.raises(ValueError, match="cannot be empty"):
            embed_code("   \n\t  ")

    def test_embed_code_calls_model_encode(self, mock_embedder):
        """Should call model.encode with the code."""
        code = "def hello(): return 'world'"
        embed_code(code)

        mock_embedder.encode.assert_called_once()
        call_args = mock_embedder.encode.call_args
        assert call_args[0][0] == code

    def test_embed_code_returns_floats(self, mock_embedding):
        """Should return list of float values."""
        with patch("washedmcp.embedder._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.encode.return_value = np.array(mock_embedding)
            mock_get_model.return_value = mock_model

            result = embed_code("def test(): pass")

            assert all(isinstance(x, float) for x in result)


class TestEmbedBatch:
    """Tests for embed_batch function."""

    def test_embed_batch_returns_list_of_lists(self, mock_embedding):
        """Should return a list of embedding lists."""
        with patch("washedmcp.embedder._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.encode.return_value = np.array([mock_embedding, mock_embedding])
            mock_get_model.return_value = mock_model

            codes = ["def a(): pass", "def b(): pass"]
            result = embed_batch(codes)

            assert isinstance(result, list)
            assert len(result) == 2
            assert all(isinstance(emb, list) for emb in result)

    def test_embed_batch_correct_count(self, mock_embedding):
        """Should return one embedding per input code."""
        with patch("washedmcp.embedder._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.encode.return_value = np.array([mock_embedding] * 5)
            mock_get_model.return_value = mock_model

            codes = ["def a(): pass"] * 5
            result = embed_batch(codes)

            assert len(result) == 5

    def test_embed_batch_empty_list_raises(self):
        """Should raise ValueError for empty list."""
        with pytest.raises(ValueError, match="cannot be empty"):
            embed_batch([])

    def test_embed_batch_empty_code_in_list_raises(self, mock_embedding):
        """Should raise ValueError if any code in list is empty."""
        with pytest.raises(ValueError, match="cannot be empty"):
            embed_batch(["def a(): pass", "", "def c(): pass"])

    def test_embed_batch_whitespace_code_raises(self, mock_embedding):
        """Should raise ValueError if any code is whitespace only."""
        with pytest.raises(ValueError, match="cannot be empty"):
            embed_batch(["def a(): pass", "  \n  "])

    def test_embed_batch_calls_encode_once(self, mock_embedding):
        """Should call encode once with all codes (batch efficiency)."""
        with patch("washedmcp.embedder._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.encode.return_value = np.array([mock_embedding] * 3)
            mock_get_model.return_value = mock_model

            codes = ["def a(): pass", "def b(): pass", "def c(): pass"]
            embed_batch(codes)

            # Should be called exactly once for batch efficiency
            assert mock_model.encode.call_count == 1

    def test_embed_batch_dimensions(self, mock_embedding):
        """Each embedding should have correct dimensions."""
        with patch("washedmcp.embedder._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.encode.return_value = np.array([mock_embedding] * 2)
            mock_get_model.return_value = mock_model

            codes = ["def a(): pass", "def b(): pass"]
            result = embed_batch(codes)

            assert all(len(emb) == EMBEDDING_DIMENSIONS for emb in result)


class TestEmbedQuery:
    """Tests for embed_query function."""

    def test_embed_query_returns_list(self, mock_embedder):
        """Should return a list of floats."""
        result = embed_query("find user validation")

        assert isinstance(result, list)

    def test_embed_query_correct_dimensions(self, mock_embedder, mock_embedding):
        """Should return embedding with correct dimensions."""
        result = embed_query("find user validation")

        assert len(result) == EMBEDDING_DIMENSIONS

    def test_embed_query_empty_raises(self):
        """Should raise ValueError for empty query."""
        with pytest.raises(ValueError, match="cannot be empty"):
            embed_query("")

    def test_embed_query_whitespace_raises(self):
        """Should raise ValueError for whitespace-only query."""
        with pytest.raises(ValueError, match="cannot be empty"):
            embed_query("   ")

    def test_embed_query_calls_encode(self, mock_embedder):
        """Should call model.encode with the query."""
        query = "find authentication function"
        embed_query(query)

        mock_embedder.encode.assert_called_once()
        call_args = mock_embedder.encode.call_args
        assert call_args[0][0] == query


class TestModelLazyLoading:
    """Tests for lazy model initialization."""

    def test_model_not_loaded_on_import(self):
        """Model should not be loaded just from importing."""
        # Reset the model
        import washedmcp.embedder as embedder_module
        original_model = embedder_module._model

        embedder_module._model = None

        # Just importing/accessing constants shouldn't load model
        _ = embedder_module.EMBEDDING_DIMENSIONS
        _ = embedder_module.MODEL_NAME

        # Model should still be None
        assert embedder_module._model is None

        # Restore
        embedder_module._model = original_model

    def test_get_model_returns_same_instance(self, mock_embedder):
        """Should return the same model instance on repeated calls."""
        with patch("washedmcp.embedder._model", None):
            with patch("washedmcp.embedder.SentenceTransformer") as mock_st:
                mock_st.return_value = mock_embedder

                # Reset _model to None to test lazy loading
                import washedmcp.embedder as embedder_module
                embedder_module._model = None

                model1 = _get_model()
                model2 = _get_model()

                # Same instance should be returned
                assert model1 is model2


class TestEmbeddingValues:
    """Tests for embedding value characteristics."""

    def test_embeddings_are_numeric(self, mock_embedding):
        """All embedding values should be numeric."""
        with patch("washedmcp.embedder._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.encode.return_value = np.array(mock_embedding)
            mock_get_model.return_value = mock_model

            result = embed_code("def test(): pass")

            assert all(isinstance(x, (int, float)) for x in result)

    def test_different_code_can_produce_different_embeddings(self):
        """Different code should potentially produce different embeddings."""
        # This is more of a sanity check - with mocking, we control this
        embedding1 = [0.1] * 384
        embedding2 = [0.2] * 384

        with patch("washedmcp.embedder._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.encode.side_effect = [
                np.array(embedding1),
                np.array(embedding2)
            ]
            mock_get_model.return_value = mock_model

            result1 = embed_code("def hello(): pass")
            result2 = embed_code("def goodbye(): pass")

            assert result1 != result2
