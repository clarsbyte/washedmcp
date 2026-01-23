# WashedMCP - Semantic Code Search MCP Server

__version__ = "0.1.0"

# Configuration
from .config import (
    get_config,
    load_config_from_file,
    reset_config,
    validate_config,
    WashedMCPConfig,
    ParserConfig,
    IndexerConfig,
    DatabaseConfig,
    EmbedderConfig,
    SummarizerConfig,
    ToonFormatterConfig,
    SearchConfig,
)

# Core modules
from .parser import extract_functions, get_supported_extensions
from .embedder import embed_code, embed_batch, embed_query, get_embedding_dimensions
from .database import init_db, add_functions, search, get_stats, compute_called_by
from .indexer import index_codebase
from .searcher import search_code, search_code_with_context, is_indexed
from .toon_formatter import format_results_rich

# Security module
from .security import (
    SecurityError,
    PathTraversalError,
    SymlinkError,
    FileSizeError,
    InputValidationError,
    EmbeddingValidationError,
    validate_path,
    sanitize_path,
    validate_file_size,
    is_safe_to_index,
    validate_query,
    validate_embedding,
    validate_embeddings_batch,
    validate_persist_path,
    sanitize_for_prompt,
    MAX_FILE_SIZE_MB,
    MAX_QUERY_LENGTH,
    EXPECTED_EMBEDDING_DIM,
)

# Async modules
from .async_indexer import (
    index_codebase_async,
    index_codebase_with_progress,
    IndexProgress,
    IndexPhase,
    ProgressCallback,
)
from .background import (
    BackgroundJobManager,
    JobInfo,
    JobStatus,
    get_job_manager,
    submit_index_job,
    get_index_job_status,
    cancel_index_job,
    get_active_indexing,
)

# Stats module
from .stats import (
    TokenStats,
    StatsTracker,
    get_tracker,
    record_search,
    get_token_savings_summary,
    get_token_stats,
    reset_stats,
)

__all__ = [
    # Version
    "__version__",
    # Configuration API
    "get_config",
    "load_config_from_file",
    "reset_config",
    "validate_config",
    "WashedMCPConfig",
    "ParserConfig",
    "IndexerConfig",
    "DatabaseConfig",
    "EmbedderConfig",
    "SummarizerConfig",
    "ToonFormatterConfig",
    "SearchConfig",
    # Core sync API
    "extract_functions",
    "get_supported_extensions",
    "embed_code",
    "embed_batch",
    "embed_query",
    "get_embedding_dimensions",
    "init_db",
    "add_functions",
    "search",
    "get_stats",
    "compute_called_by",
    "index_codebase",
    "search_code",
    "search_code_with_context",
    "is_indexed",
    "format_results_rich",
    # Security API
    "SecurityError",
    "PathTraversalError",
    "SymlinkError",
    "FileSizeError",
    "InputValidationError",
    "EmbeddingValidationError",
    "validate_path",
    "sanitize_path",
    "validate_file_size",
    "is_safe_to_index",
    "validate_query",
    "validate_embedding",
    "validate_embeddings_batch",
    "validate_persist_path",
    "sanitize_for_prompt",
    "MAX_FILE_SIZE_MB",
    "MAX_QUERY_LENGTH",
    "EXPECTED_EMBEDDING_DIM",
    # Async API
    "index_codebase_async",
    "index_codebase_with_progress",
    "IndexProgress",
    "IndexPhase",
    "ProgressCallback",
    # Background job API
    "BackgroundJobManager",
    "JobInfo",
    "JobStatus",
    "get_job_manager",
    "submit_index_job",
    "get_index_job_status",
    "cancel_index_job",
    "get_active_indexing",
    # Stats API
    "TokenStats",
    "StatsTracker",
    "get_tracker",
    "record_search",
    "get_token_savings_summary",
    "get_token_stats",
    "reset_stats",
]
