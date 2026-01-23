"""
Async Indexer Module - Non-blocking codebase indexing with progress reporting.

Provides async versions of indexing operations to prevent MCP server freezing
during long-running indexing operations.
"""

import asyncio
import os
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum
import concurrent.futures
import time

from .logging_config import get_logger
from .security import (
    sanitize_path,
    validate_persist_path,
    is_safe_to_index,
    SecurityError,
    MAX_FILE_SIZE_MB,
)

logger = get_logger(__name__)


class IndexPhase(Enum):
    """Phases of the indexing process."""
    SCANNING = "scanning"
    PARSING = "parsing"
    EMBEDDING = "embedding"
    STORING = "storing"
    COMPUTING_RELATIONS = "computing_relations"
    COMPLETE = "complete"
    ERROR = "error"
    CANCELLED = "cancelled"


@dataclass
class IndexProgress:
    """Progress information for indexing operation."""
    status: str = "pending"  # pending, in_progress, complete, error, cancelled
    phase: str = "scanning"
    progress: float = 0.0  # 0.0 to 1.0
    files_processed: int = 0
    total_files: int = 0
    functions_found: int = 0
    current_file: str = ""
    error_message: Optional[str] = None
    start_time: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        elapsed = time.time() - self.start_time
        return {
            "status": self.status,
            "phase": self.phase,
            "progress": round(self.progress, 4),
            "files_processed": self.files_processed,
            "total_files": self.total_files,
            "functions_found": self.functions_found,
            "current_file": self.current_file,
            "error_message": self.error_message,
            "elapsed_seconds": round(elapsed, 2),
        }


# Type alias for progress callback
ProgressCallback = Callable[[IndexProgress], None]


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
    ".washedmcp",
}


async def _scan_files_async(
    path: str,
    supported_extensions: set,
    progress: IndexProgress,
    progress_callback: Optional[ProgressCallback] = None,
    max_file_size_mb: float = MAX_FILE_SIZE_MB,
) -> List[str]:
    """
    Scan directory for files to index asynchronously.

    Args:
        path: Root directory path
        supported_extensions: Set of supported file extensions
        progress: Progress object to update
        progress_callback: Optional callback for progress updates
        max_file_size_mb: Maximum file size in MB to process

    Returns:
        List of file paths to process
    """
    files_to_process = []

    def _scan_sync():
        """Synchronous scanning in thread."""
        result = []
        for root, dirs, files in os.walk(path, followlinks=False):
            # Check for cancellation
            if asyncio.current_task() and asyncio.current_task().cancelled():
                raise asyncio.CancelledError()

            # Skip directories we don't want to index
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

            # Also skip symlinked directories to prevent loops
            dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(root, d))]

            for filename in files:
                _, ext = os.path.splitext(filename)
                if ext in supported_extensions:
                    filepath = os.path.join(root, filename)

                    # Security check: validate file is safe to index
                    is_safe, reason = is_safe_to_index(filepath, path, max_file_size_mb)
                    if not is_safe:
                        logger.debug("Skipping file (security): %s - %s", filepath, reason)
                        continue

                    result.append(filepath)
        return result

    # Run scanning in thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    files_to_process = await loop.run_in_executor(None, _scan_sync)

    progress.total_files = len(files_to_process)
    progress.phase = IndexPhase.SCANNING.value

    if progress_callback:
        progress_callback(progress)

    return files_to_process


async def _parse_files_async(
    files: List[str],
    progress: IndexProgress,
    progress_callback: Optional[ProgressCallback] = None,
    batch_size: int = 10,
) -> List[Dict[str, Any]]:
    """
    Parse files for functions asynchronously in batches.

    Args:
        files: List of file paths to parse
        progress: Progress object to update
        progress_callback: Optional callback for progress updates
        batch_size: Number of files to process before yielding

    Returns:
        List of function dictionaries
    """
    from .parser import extract_functions

    all_functions: List[Dict[str, Any]] = []
    progress.phase = IndexPhase.PARSING.value
    progress.status = "in_progress"

    loop = asyncio.get_event_loop()

    for i, filepath in enumerate(files):
        # Check for cancellation
        if asyncio.current_task() and asyncio.current_task().cancelled():
            raise asyncio.CancelledError()

        progress.current_file = filepath
        progress.files_processed = i + 1
        progress.progress = (i + 1) / len(files) * 0.3  # Parsing is ~30% of total work

        try:
            # Run parsing in thread pool to avoid blocking
            functions = await loop.run_in_executor(None, extract_functions, filepath)

            if functions:
                all_functions.extend(functions)
                progress.functions_found = len(all_functions)
        except Exception as e:
            # Log error but continue
            logger.debug("Error parsing %s: %s", filepath, e)

        # Yield control periodically to allow cancellation and other tasks
        if (i + 1) % batch_size == 0:
            if progress_callback:
                progress_callback(progress)
            await asyncio.sleep(0)  # Yield to event loop

    if progress_callback:
        progress_callback(progress)

    return all_functions


async def _embed_functions_async(
    functions: List[Dict[str, Any]],
    progress: IndexProgress,
    progress_callback: Optional[ProgressCallback] = None,
    batch_size: int = 50,
) -> List[Dict[str, Any]]:
    """
    Embed functions asynchronously in batches.

    Args:
        functions: List of function dictionaries
        progress: Progress object to update
        progress_callback: Optional callback for progress updates
        batch_size: Number of functions to embed per batch

    Returns:
        Functions with embeddings added
    """
    from .embedder import embed_batch

    progress.phase = IndexPhase.EMBEDDING.value

    loop = asyncio.get_event_loop()
    total_functions = len(functions)

    # Process in batches
    for i in range(0, total_functions, batch_size):
        # Check for cancellation
        if asyncio.current_task() and asyncio.current_task().cancelled():
            raise asyncio.CancelledError()

        batch_end = min(i + batch_size, total_functions)
        batch = functions[i:batch_end]
        codes = [f["code"] for f in batch]

        # Update progress
        progress.progress = 0.3 + (batch_end / total_functions) * 0.5  # Embedding is ~50% of work
        progress.current_file = f"Embedding batch {i // batch_size + 1}"

        if progress_callback:
            progress_callback(progress)

        # Run embedding in thread pool
        embeddings = await loop.run_in_executor(None, embed_batch, codes)

        # Assign embeddings to functions
        for func, embedding in zip(batch, embeddings):
            func["embedding"] = embedding

        # Yield to event loop
        await asyncio.sleep(0)

    return functions


async def _store_functions_async(
    functions: List[Dict[str, Any]],
    persist_path: str,
    progress: IndexProgress,
    progress_callback: Optional[ProgressCallback] = None,
) -> None:
    """
    Store functions in database asynchronously.

    Args:
        functions: List of function dictionaries with embeddings
        persist_path: Database persistence path
        progress: Progress object to update
        progress_callback: Optional callback for progress updates
    """
    from .database import init_db, add_functions, clear_collection

    progress.phase = IndexPhase.STORING.value
    progress.progress = 0.8  # Storing is ~10% of work
    progress.current_file = "Initializing database"

    if progress_callback:
        progress_callback(progress)

    loop = asyncio.get_event_loop()

    # Initialize and clear database
    await loop.run_in_executor(None, init_db, persist_path)
    await loop.run_in_executor(None, clear_collection)

    # Check for cancellation
    if asyncio.current_task() and asyncio.current_task().cancelled():
        raise asyncio.CancelledError()

    progress.current_file = "Storing functions"
    if progress_callback:
        progress_callback(progress)

    # Add functions (already handles batching internally)
    await loop.run_in_executor(None, add_functions, functions)

    progress.progress = 0.9


async def _compute_relations_async(
    progress: IndexProgress,
    progress_callback: Optional[ProgressCallback] = None,
) -> None:
    """
    Compute call relationships asynchronously.

    Args:
        progress: Progress object to update
        progress_callback: Optional callback for progress updates
    """
    from .database import compute_called_by

    progress.phase = IndexPhase.COMPUTING_RELATIONS.value
    progress.progress = 0.9  # Relations is ~10% of work
    progress.current_file = "Computing call relationships"

    if progress_callback:
        progress_callback(progress)

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, compute_called_by)

    progress.progress = 1.0


async def index_codebase_async(
    path: str,
    persist_path: Optional[str] = None,
    skip_summarize: bool = True,
    progress_callback: Optional[ProgressCallback] = None,
    timeout: Optional[float] = None,
    max_file_size_mb: float = MAX_FILE_SIZE_MB,
) -> Dict[str, Any]:
    """
    Index a codebase asynchronously with progress reporting.

    Args:
        path: Path to the codebase directory to index
        persist_path: Path where ChromaDB will persist data.
                      If None, defaults to <path>/.washedmcp/chroma
        skip_summarize: If True, skip summarization step
        progress_callback: Optional callback for progress updates
                          Function signature: (IndexProgress) -> None
        timeout: Optional timeout in seconds for the entire operation
        max_file_size_mb: Maximum file size in MB to process

    Returns:
        Dict with status, files_processed, functions_indexed, and path

    Raises:
        asyncio.CancelledError: If operation was cancelled
        asyncio.TimeoutError: If operation exceeded timeout
        SecurityError: If path validation fails
    """
    from .parser import get_supported_extensions

    # Validate and sanitize the input path
    try:
        path = sanitize_path(path)
    except SecurityError as e:
        logger.error("Invalid path provided: %s", e)
        return {
            "status": "error",
            "error": f"Invalid path: {e}",
            "files_processed": 0,
            "functions_indexed": 0,
            "path": path,
        }

    # Convert to absolute path
    abs_path = os.path.abspath(path)

    # Verify the path exists and is a directory
    if not os.path.exists(abs_path):
        logger.error("Path does not exist: %s", abs_path)
        return {
            "status": "error",
            "error": f"Path does not exist: {abs_path}",
            "files_processed": 0,
            "functions_indexed": 0,
            "path": abs_path,
        }

    if not os.path.isdir(abs_path):
        logger.error("Path is not a directory: %s", abs_path)
        return {
            "status": "error",
            "error": f"Path is not a directory: {abs_path}",
            "files_processed": 0,
            "functions_indexed": 0,
            "path": abs_path,
        }

    # Default persist_path
    if persist_path is None:
        persist_path = os.path.join(abs_path, ".washedmcp", "chroma")

    # Validate persist_path
    try:
        persist_path = validate_persist_path(persist_path)
    except SecurityError as e:
        logger.error("Invalid persist path: %s", e)
        return {
            "status": "error",
            "error": f"Invalid persist path: {e}",
            "files_processed": 0,
            "functions_indexed": 0,
            "path": abs_path,
        }

    logger.info("Starting async indexing of: %s", abs_path)

    # Initialize progress
    progress = IndexProgress(
        status="in_progress",
        phase=IndexPhase.SCANNING.value,
    )

    async def _do_index():
        try:
            # Step 1: Scan files
            supported_extensions = set(get_supported_extensions())
            files = await _scan_files_async(
                abs_path, supported_extensions, progress, progress_callback, max_file_size_mb
            )

            if not files:
                progress.status = "complete"
                progress.phase = IndexPhase.COMPLETE.value
                progress.progress = 1.0
                if progress_callback:
                    progress_callback(progress)
                return {
                    "status": "success",
                    "files_processed": 0,
                    "functions_indexed": 0,
                    "path": abs_path,
                }

            # Step 2: Parse files
            all_functions = await _parse_files_async(
                files, progress, progress_callback
            )

            if not all_functions:
                progress.status = "complete"
                progress.phase = IndexPhase.COMPLETE.value
                progress.progress = 1.0
                if progress_callback:
                    progress_callback(progress)
                return {
                    "status": "success",
                    "files_processed": progress.files_processed,
                    "functions_indexed": 0,
                    "path": abs_path,
                }

            # Step 3: Embed functions
            all_functions = await _embed_functions_async(
                all_functions, progress, progress_callback
            )

            # Step 4: Add summaries (skip if requested)
            if skip_summarize:
                for func in all_functions:
                    func["summary"] = ""

            # Step 5: Store functions
            await _store_functions_async(
                all_functions, persist_path, progress, progress_callback
            )

            # Step 6: Compute relationships
            await _compute_relations_async(progress, progress_callback)

            # Done!
            progress.status = "complete"
            progress.phase = IndexPhase.COMPLETE.value
            progress.progress = 1.0
            progress.current_file = ""

            if progress_callback:
                progress_callback(progress)

            return {
                "status": "success",
                "files_processed": progress.files_processed,
                "functions_indexed": len(all_functions),
                "path": abs_path,
            }

        except asyncio.CancelledError:
            logger.warning("Async indexing cancelled for: %s", abs_path)
            progress.status = "cancelled"
            progress.phase = IndexPhase.CANCELLED.value
            progress.error_message = "Operation was cancelled"
            if progress_callback:
                progress_callback(progress)
            raise

        except Exception as e:
            logger.exception("Error during async indexing of %s", abs_path)
            progress.status = "error"
            progress.phase = IndexPhase.ERROR.value
            progress.error_message = str(e)
            if progress_callback:
                progress_callback(progress)
            return {
                "status": "error",
                "error": str(e),
                "files_processed": progress.files_processed,
                "functions_indexed": 0,
                "path": abs_path,
            }

    # Apply timeout if specified
    if timeout:
        return await asyncio.wait_for(_do_index(), timeout=timeout)
    else:
        return await _do_index()


# Convenience function for sync callers
def index_codebase_with_progress(
    path: str,
    persist_path: Optional[str] = None,
    skip_summarize: bool = True,
    progress_callback: Optional[ProgressCallback] = None,
) -> Dict[str, Any]:
    """
    Synchronous wrapper for async indexing with progress callback.

    Creates a new event loop if needed.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're already in an async context, we can't use run()
            raise RuntimeError("Cannot call sync wrapper from async context")
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(
        index_codebase_async(
            path,
            persist_path,
            skip_summarize,
            progress_callback,
        )
    )


if __name__ == "__main__":
    import sys

    def print_progress(progress: IndexProgress):
        """Print progress to console."""
        p = progress.to_dict()
        print(f"\r[{p['phase']:20}] {p['progress']*100:5.1f}% | "
              f"Files: {p['files_processed']}/{p['total_files']} | "
              f"Functions: {p['functions_found']} | "
              f"{p['current_file'][:40]}", end="", flush=True)

    # Test with path from command line or default
    if len(sys.argv) > 1:
        test_path = sys.argv[1]
    else:
        test_path = os.path.join(os.path.dirname(__file__), "..", "tests", "test_codebase")

    print("=" * 60)
    print("ASYNC CODEBASE INDEXER")
    print("=" * 60)
    print(f"Indexing: {test_path}")
    print()

    async def test_async():
        result = await index_codebase_async(
            test_path,
            progress_callback=print_progress,
        )
        print()  # New line after progress
        return result

    result = asyncio.run(test_async())

    print()
    print("=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    for key, value in result.items():
        print(f"  {key}: {value}")
