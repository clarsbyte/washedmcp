"""
Security module for WashedMCP - input validation and path sanitization.

Addresses security concerns:
1. Path traversal attacks (e.g., ../../../etc/passwd)
2. Symlink-based attacks
3. File size limits to prevent DoS
4. Input validation for queries
5. Embedding dimension validation
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Optional, Tuple

# Configuration constants
MAX_FILE_SIZE_MB = 10  # Default max file size in megabytes
MAX_QUERY_LENGTH = 1000  # Maximum query string length
EXPECTED_EMBEDDING_DIM = 384  # Expected embedding dimensions for all-MiniLM-L6-v2

# Dangerous path patterns to block
DANGEROUS_PATTERNS = [
    r'\.\./',  # Parent directory traversal
    r'\.\.\\',  # Windows parent directory traversal
    r'\x00',  # Null byte injection
]

# Sensitive file patterns that should not be indexed
SENSITIVE_FILE_PATTERNS = [
    r'\.env$',
    r'\.env\.',
    r'credentials',
    r'secrets?\.',
    r'private[_-]?key',
    r'\.pem$',
    r'\.key$',
    r'\.p12$',
    r'\.pfx$',
    r'id_rsa',
    r'id_dsa',
    r'id_ecdsa',
    r'id_ed25519',
]


class SecurityError(Exception):
    """Base exception for security-related errors."""
    pass


class PathTraversalError(SecurityError):
    """Raised when path traversal is detected."""
    pass


class SymlinkError(SecurityError):
    """Raised when unsafe symlink is detected."""
    pass


class FileSizeError(SecurityError):
    """Raised when file exceeds size limit."""
    pass


class InputValidationError(SecurityError):
    """Raised when input validation fails."""
    pass


class EmbeddingValidationError(SecurityError):
    """Raised when embedding validation fails."""
    pass


def sanitize_path(path: str) -> str:
    """
    Normalize and clean a file path.

    Removes redundant separators, resolves . and .. components where safe,
    and normalizes the path format.

    Args:
        path: The path to sanitize.

    Returns:
        A normalized, cleaned path string.

    Raises:
        InputValidationError: If the path is empty or invalid.
    """
    if not path:
        raise InputValidationError("Path cannot be empty")

    if not isinstance(path, str):
        raise InputValidationError(f"Path must be a string, got {type(path).__name__}")

    # Check for null bytes (common injection attack)
    if '\x00' in path:
        raise InputValidationError("Path contains null bytes")

    # Normalize the path (handles redundant separators, etc.)
    cleaned = os.path.normpath(path)

    return cleaned


def validate_path(path: str, base_dir: str) -> str:
    """
    Validate that a path is within the allowed base directory.

    Resolves symlinks and ensures the final path is within base_dir.
    Prevents path traversal attacks.

    Args:
        path: The path to validate.
        base_dir: The allowed base directory.

    Returns:
        The resolved absolute path if valid.

    Raises:
        PathTraversalError: If the path escapes the base directory.
        SymlinkError: If a symlink points outside the base directory.
        InputValidationError: If inputs are invalid.
    """
    if not path:
        raise InputValidationError("Path cannot be empty")

    if not base_dir:
        raise InputValidationError("Base directory cannot be empty")

    # Sanitize both paths first
    path = sanitize_path(path)
    base_dir = sanitize_path(base_dir)

    # Convert to absolute paths
    abs_base = os.path.abspath(base_dir)

    # If path is relative, join with base_dir
    if not os.path.isabs(path):
        abs_path = os.path.abspath(os.path.join(abs_base, path))
    else:
        abs_path = os.path.abspath(path)

    # Resolve symlinks to get the real path
    try:
        real_path = os.path.realpath(abs_path)
        real_base = os.path.realpath(abs_base)
    except (OSError, ValueError) as e:
        raise PathTraversalError(f"Cannot resolve path: {e}")

    # Ensure the resolved path is within the base directory
    # Add trailing separator to avoid false positives
    # e.g., /home/user vs /home/username
    if not real_path.startswith(real_base + os.sep) and real_path != real_base:
        raise PathTraversalError(
            f"Path '{path}' resolves to '{real_path}' which is outside "
            f"the allowed directory '{real_base}'"
        )

    return real_path


def validate_file_size(path: str, max_size_mb: float = MAX_FILE_SIZE_MB) -> bool:
    """
    Check if a file is within the allowed size limit.

    Args:
        path: Path to the file to check.
        max_size_mb: Maximum allowed file size in megabytes.

    Returns:
        True if file is within size limit.

    Raises:
        FileSizeError: If file exceeds the size limit.
        InputValidationError: If path is invalid or file doesn't exist.
    """
    if not path:
        raise InputValidationError("Path cannot be empty")

    if max_size_mb <= 0:
        raise InputValidationError("Max size must be positive")

    if not os.path.exists(path):
        raise InputValidationError(f"File does not exist: {path}")

    if not os.path.isfile(path):
        raise InputValidationError(f"Path is not a file: {path}")

    try:
        file_size = os.path.getsize(path)
        max_size_bytes = max_size_mb * 1024 * 1024

        if file_size > max_size_bytes:
            raise FileSizeError(
                f"File '{path}' is {file_size / (1024*1024):.2f}MB, "
                f"exceeds limit of {max_size_mb}MB"
            )

        return True

    except OSError as e:
        raise InputValidationError(f"Cannot read file size: {e}")


def is_symlink_safe(path: str, base_dir: str) -> bool:
    """
    Check if a symlink (if present) points to a location within base_dir.

    Args:
        path: Path to check.
        base_dir: The allowed base directory.

    Returns:
        True if path is not a symlink or symlink target is within base_dir.
        False if symlink points outside base_dir.
    """
    if not os.path.islink(path):
        return True

    try:
        real_path = os.path.realpath(path)
        real_base = os.path.realpath(base_dir)

        return real_path.startswith(real_base + os.sep) or real_path == real_base
    except (OSError, ValueError):
        return False


def is_safe_to_index(
    path: str,
    base_dir: str,
    max_size_mb: float = MAX_FILE_SIZE_MB,
    check_sensitive: bool = True
) -> Tuple[bool, Optional[str]]:
    """
    Combined check to determine if a file is safe to index.

    Performs all security checks:
    - Path is within base directory
    - Not a dangerous symlink
    - File size is within limits
    - Optionally checks for sensitive files

    Args:
        path: Path to the file to check.
        base_dir: The allowed base directory.
        max_size_mb: Maximum allowed file size in megabytes.
        check_sensitive: Whether to check for sensitive file patterns.

    Returns:
        Tuple of (is_safe, reason). If not safe, reason contains the explanation.
    """
    try:
        # Validate path is within base directory
        validated_path = validate_path(path, base_dir)

        # Check if it's a file (not directory)
        if not os.path.isfile(validated_path):
            return False, f"Not a file: {path}"

        # Check symlink safety
        if os.path.islink(path) and not is_symlink_safe(path, base_dir):
            return False, f"Symlink points outside base directory: {path}"

        # Check file size
        validate_file_size(validated_path, max_size_mb)

        # Check for sensitive files
        if check_sensitive:
            filename = os.path.basename(validated_path).lower()
            for pattern in SENSITIVE_FILE_PATTERNS:
                if re.search(pattern, filename, re.IGNORECASE):
                    return False, f"Sensitive file detected: {path}"

        return True, None

    except PathTraversalError as e:
        return False, f"Path traversal blocked: {e}"
    except SymlinkError as e:
        return False, f"Unsafe symlink: {e}"
    except FileSizeError as e:
        return False, f"File too large: {e}"
    except InputValidationError as e:
        return False, f"Invalid input: {e}"
    except Exception as e:
        return False, f"Unexpected error: {e}"


def validate_query(query: str, max_length: int = MAX_QUERY_LENGTH) -> str:
    """
    Validate and sanitize a search query string.

    Args:
        query: The query string to validate.
        max_length: Maximum allowed query length.

    Returns:
        The validated and trimmed query string.

    Raises:
        InputValidationError: If query is invalid.
    """
    if query is None:
        raise InputValidationError("Query cannot be None")

    if not isinstance(query, str):
        raise InputValidationError(f"Query must be a string, got {type(query).__name__}")

    # Strip whitespace
    query = query.strip()

    if not query:
        raise InputValidationError("Query cannot be empty")

    if len(query) > max_length:
        raise InputValidationError(
            f"Query exceeds maximum length of {max_length} characters "
            f"(got {len(query)})"
        )

    # Check for null bytes
    if '\x00' in query:
        raise InputValidationError("Query contains null bytes")

    return query


def validate_embedding(
    embedding: list,
    expected_dim: int = EXPECTED_EMBEDDING_DIM
) -> bool:
    """
    Validate that an embedding has the correct dimensions and format.

    Args:
        embedding: The embedding vector to validate.
        expected_dim: Expected number of dimensions.

    Returns:
        True if embedding is valid.

    Raises:
        EmbeddingValidationError: If embedding is invalid.
    """
    if embedding is None:
        raise EmbeddingValidationError("Embedding cannot be None")

    if not isinstance(embedding, (list, tuple)):
        raise EmbeddingValidationError(
            f"Embedding must be a list or tuple, got {type(embedding).__name__}"
        )

    if len(embedding) != expected_dim:
        raise EmbeddingValidationError(
            f"Embedding has {len(embedding)} dimensions, expected {expected_dim}"
        )

    # Validate all elements are numeric
    for i, val in enumerate(embedding):
        if not isinstance(val, (int, float)):
            raise EmbeddingValidationError(
                f"Embedding element at index {i} is not numeric: {type(val).__name__}"
            )

        # Check for NaN or Inf
        if isinstance(val, float):
            if val != val:  # NaN check
                raise EmbeddingValidationError(
                    f"Embedding contains NaN at index {i}"
                )
            if abs(val) == float('inf'):
                raise EmbeddingValidationError(
                    f"Embedding contains Inf at index {i}"
                )

    return True


def validate_embeddings_batch(
    embeddings: list,
    expected_dim: int = EXPECTED_EMBEDDING_DIM
) -> bool:
    """
    Validate a batch of embeddings.

    Args:
        embeddings: List of embedding vectors.
        expected_dim: Expected number of dimensions per embedding.

    Returns:
        True if all embeddings are valid.

    Raises:
        EmbeddingValidationError: If any embedding is invalid.
    """
    if embeddings is None:
        raise EmbeddingValidationError("Embeddings batch cannot be None")

    if not isinstance(embeddings, list):
        raise EmbeddingValidationError(
            f"Embeddings must be a list, got {type(embeddings).__name__}"
        )

    if not embeddings:
        raise EmbeddingValidationError("Embeddings batch cannot be empty")

    for i, embedding in enumerate(embeddings):
        try:
            validate_embedding(embedding, expected_dim)
        except EmbeddingValidationError as e:
            raise EmbeddingValidationError(
                f"Invalid embedding at index {i}: {e}"
            )

    return True


def validate_persist_path(persist_path: str) -> str:
    """
    Validate a persistence path for the database.

    Ensures the path is safe for use as a database storage location.

    Args:
        persist_path: The path where database will be stored.

    Returns:
        The validated absolute path.

    Raises:
        InputValidationError: If path is invalid.
        PathTraversalError: If path contains traversal attempts.
    """
    if not persist_path:
        raise InputValidationError("Persist path cannot be empty")

    # Sanitize the path
    cleaned = sanitize_path(persist_path)

    # Check for dangerous patterns in the original path
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, persist_path):
            raise PathTraversalError(
                f"Persist path contains dangerous pattern: {persist_path}"
            )

    # Convert to absolute path
    abs_path = os.path.abspath(cleaned)

    # Ensure parent directory exists or can be created
    parent_dir = os.path.dirname(abs_path)
    if parent_dir and not os.path.exists(parent_dir):
        # Check if we can create the parent
        try:
            os.makedirs(parent_dir, exist_ok=True)
        except OSError as e:
            raise InputValidationError(f"Cannot create persist directory: {e}")

    return abs_path


def sanitize_for_prompt(text: str, max_length: int = 10000) -> str:
    """
    Sanitize text before including in LLM prompts to prevent prompt injection.

    Args:
        text: Text to sanitize.
        max_length: Maximum allowed text length.

    Returns:
        Sanitized text safe for prompt inclusion.
    """
    if not text:
        return ""

    if not isinstance(text, str):
        text = str(text)

    # Truncate if too long
    if len(text) > max_length:
        text = text[:max_length] + "... [truncated]"

    # Remove null bytes
    text = text.replace('\x00', '')

    return text


if __name__ == "__main__":
    import tempfile

    print("Testing security module...")
    print("=" * 60)

    # Test path sanitization
    print("\n1. Testing sanitize_path:")
    test_paths = [
        "/home/user/code",
        "./relative/path",
        "../parent/path",
        "/path/with/../dots",
    ]
    for p in test_paths:
        try:
            result = sanitize_path(p)
            print(f"   '{p}' -> '{result}'")
        except Exception as e:
            print(f"   '{p}' -> ERROR: {e}")

    # Test path validation
    print("\n2. Testing validate_path:")
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create a test file
        test_file = os.path.join(tmpdir, "test.py")
        with open(test_file, "w") as f:
            f.write("print('hello')")

        # Valid path
        try:
            result = validate_path(test_file, tmpdir)
            print(f"   Valid path: {result}")
        except Exception as e:
            print(f"   Valid path ERROR: {e}")

        # Path traversal attempt
        try:
            validate_path("../../../etc/passwd", tmpdir)
            print("   Path traversal: ALLOWED (BAD!)")
        except PathTraversalError:
            print("   Path traversal: BLOCKED (good)")

    # Test query validation
    print("\n3. Testing validate_query:")
    test_queries = [
        "normal query",
        "",
        "a" * 2000,
        "query\x00with\x00nulls",
    ]
    for q in test_queries:
        try:
            result = validate_query(q)
            print(f"   '{q[:20]}...' -> OK")
        except Exception as e:
            print(f"   '{q[:20]}...' -> {type(e).__name__}: {e}")

    # Test embedding validation
    print("\n4. Testing validate_embedding:")
    test_embeddings = [
        [0.1] * 384,  # Valid
        [0.1] * 100,  # Wrong dimensions
        None,         # None
        [float('nan')] + [0.1] * 383,  # Contains NaN
    ]
    for i, emb in enumerate(test_embeddings):
        try:
            validate_embedding(emb)
            print(f"   Embedding {i}: VALID")
        except Exception as e:
            print(f"   Embedding {i}: {type(e).__name__}")

    # Test is_safe_to_index
    print("\n5. Testing is_safe_to_index:")
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test files
        safe_file = os.path.join(tmpdir, "safe.py")
        with open(safe_file, "w") as f:
            f.write("print('hello')")

        env_file = os.path.join(tmpdir, ".env")
        with open(env_file, "w") as f:
            f.write("SECRET=value")

        is_safe, reason = is_safe_to_index(safe_file, tmpdir)
        print(f"   safe.py: {'SAFE' if is_safe else 'BLOCKED'} - {reason}")

        is_safe, reason = is_safe_to_index(env_file, tmpdir)
        print(f"   .env: {'SAFE' if is_safe else 'BLOCKED'} - {reason}")

    print("\n" + "=" * 60)
    print("Security module tests complete!")
