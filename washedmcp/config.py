"""
Configuration module for WashedMCP.

Provides centralized configuration management with support for:
- Environment variables
- Optional YAML/TOML config files
- Sensible defaults
- Type validation

Usage:
    from .config import get_config
    config = get_config()

    # Access settings
    model_name = config.embedder.model_name
    skip_dirs = config.indexer.skip_dirs
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

from .logging_config import get_logger

logger = get_logger(__name__)

# Try to import yaml and toml for config file support
try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False

try:
    import tomllib  # Python 3.11+
    HAS_TOML = True
except ImportError:
    try:
        import tomli as tomllib  # Fallback for Python < 3.11
        HAS_TOML = True
    except ImportError:
        HAS_TOML = False


# =============================================================================
# Configuration Data Classes
# =============================================================================

@dataclass
class ParserConfig:
    """Configuration for the code parser."""

    # Extension to (language_name, language_type) mapping
    # This is a dict mapping file extension -> language name
    # The actual Language objects are created at runtime
    extension_languages: Dict[str, str] = field(default_factory=lambda: {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",  # JSX uses JS grammar
        ".ts": "typescript",
        ".tsx": "typescript",  # TSX uses TSX grammar (handled specially)
        ".mjs": "javascript",
        ".cjs": "javascript",
    })

    def get_supported_extensions(self) -> List[str]:
        """Return list of supported file extensions."""
        return list(self.extension_languages.keys())


@dataclass
class IndexerConfig:
    """Configuration for the codebase indexer."""

    # Directories to skip during indexing
    skip_dirs: set = field(default_factory=lambda: {
        "node_modules",
        ".git",
        "__pycache__",
        ".venv",
        "venv",
        ".env",
        "dist",
        "build",
        ".next",
        ".nuxt",
        "coverage",
        ".pytest_cache",
        ".mypy_cache",
        ".tox",
        "egg-info",
        ".eggs",
    })

    # Batch size for database operations
    batch_size: int = 5000

    # Whether to skip summarization by default
    skip_summarize_default: bool = True


@dataclass
class DatabaseConfig:
    """Configuration for the ChromaDB vector database."""

    # Default persist path (relative to indexed project or absolute)
    default_persist_dir: str = ".washedmcp"
    default_persist_subdir: str = "chroma"

    # Full default path (joined)
    @property
    def default_persist_path(self) -> str:
        return os.path.join(self.default_persist_dir, self.default_persist_subdir)

    # Collection name
    collection_name: str = "codebase"

    # Distance metric for similarity search
    distance_metric: str = "cosine"  # Options: cosine, l2, ip

    # Batch size for upsert operations
    upsert_batch_size: int = 5000

    # Disable telemetry
    anonymized_telemetry: bool = False


@dataclass
class EmbedderConfig:
    """Configuration for the embedding model."""

    # Model name (from sentence-transformers)
    model_name: str = "all-MiniLM-L6-v2"

    # Expected embedding dimensions (for validation)
    embedding_dimensions: int = 384

    # Show progress bar during batch embedding
    show_progress_bar: bool = True


@dataclass
class SummarizerConfig:
    """Configuration for the function summarizer."""

    # Model to use for summarization
    model: str = "claude-3-haiku-20240307"

    # Maximum summary length in characters
    max_summary_length: int = 100

    # Maximum tokens for API response
    max_tokens: int = 100

    # Prompt template for summarization
    prompt_template: str = """Summarize what this function does in 10 words or less. Be specific about the action. Just return the summary, nothing else.

Function: {code}"""

    # Fallback message when summarization fails
    fallback_message: str = "Unable to summarize"


@dataclass
class ToonFormatterConfig:
    """Configuration for the TOON output formatter."""

    # Column specifications: (key, header, max_width)
    # Using a list of tuples for ordered columns
    columns: List[Tuple[str, str, int]] = field(default_factory=lambda: [
        ("function_name", "function_name", 20),
        ("file_path", "file_path", 30),
        ("line_start", "line", 6),
        ("summary", "summary", 40),
        ("similarity", "similarity", 10),
    ])

    # Indent for nested rows
    row_indent: str = "  "

    # Column separator
    column_separator: str = " | "

    # Maximum lines of code to show in rich format
    max_code_lines: int = 20

    # Truncation indicator
    truncation_indicator: str = "..."


@dataclass
class SearchConfig:
    """Configuration for code search."""

    # Default number of results
    default_top_k: int = 5

    # Default context expansion depth
    default_depth: int = 1

    # Maximum depth allowed
    max_depth: int = 5


@dataclass
class WashedMCPConfig:
    """Main configuration container for WashedMCP."""

    parser: ParserConfig = field(default_factory=ParserConfig)
    indexer: IndexerConfig = field(default_factory=IndexerConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    embedder: EmbedderConfig = field(default_factory=EmbedderConfig)
    summarizer: SummarizerConfig = field(default_factory=SummarizerConfig)
    toon_formatter: ToonFormatterConfig = field(default_factory=ToonFormatterConfig)
    search: SearchConfig = field(default_factory=SearchConfig)

    # Debug mode
    debug: bool = False

    # Verbose output
    verbose: bool = False


# =============================================================================
# Configuration Loading Functions
# =============================================================================

def _load_from_env(config: WashedMCPConfig) -> None:
    """Load configuration from environment variables."""

    # Parser settings
    if ext_map := os.getenv("WASHEDMCP_EXTENSION_LANGUAGES"):
        try:
            # Format: ".py:python,.js:javascript"
            pairs = ext_map.split(",")
            config.parser.extension_languages = {}
            for pair in pairs:
                ext, lang = pair.strip().split(":")
                config.parser.extension_languages[ext.strip()] = lang.strip()
        except ValueError:
            pass  # Keep default on parse error

    # Indexer settings
    if skip_dirs := os.getenv("WASHEDMCP_SKIP_DIRS"):
        config.indexer.skip_dirs = set(d.strip() for d in skip_dirs.split(","))

    if batch_size := os.getenv("WASHEDMCP_BATCH_SIZE"):
        try:
            config.indexer.batch_size = int(batch_size)
        except ValueError:
            pass

    if skip_summarize := os.getenv("WASHEDMCP_SKIP_SUMMARIZE"):
        config.indexer.skip_summarize_default = skip_summarize.lower() in ("true", "1", "yes")

    # Database settings
    if persist_path := os.getenv("WASHEDMCP_PERSIST_PATH"):
        # Split into dir and subdir if it contains a path separator
        path = Path(persist_path)
        if len(path.parts) >= 2:
            config.database.default_persist_dir = str(path.parent)
            config.database.default_persist_subdir = path.name
        else:
            config.database.default_persist_dir = persist_path
            config.database.default_persist_subdir = ""

    # Legacy env var support
    if chroma_path := os.getenv("CHROMA_PERSIST_PATH"):
        path = Path(chroma_path)
        if len(path.parts) >= 2:
            config.database.default_persist_dir = str(path.parent)
            config.database.default_persist_subdir = path.name
        else:
            config.database.default_persist_dir = chroma_path
            config.database.default_persist_subdir = ""

    if collection_name := os.getenv("WASHEDMCP_COLLECTION_NAME"):
        config.database.collection_name = collection_name

    if distance_metric := os.getenv("WASHEDMCP_DISTANCE_METRIC"):
        if distance_metric in ("cosine", "l2", "ip"):
            config.database.distance_metric = distance_metric

    # Embedder settings
    if model_name := os.getenv("WASHEDMCP_EMBEDDING_MODEL"):
        config.embedder.model_name = model_name

    if embedding_dim := os.getenv("WASHEDMCP_EMBEDDING_DIMENSIONS"):
        try:
            config.embedder.embedding_dimensions = int(embedding_dim)
        except ValueError:
            pass

    # Summarizer settings
    if summarizer_model := os.getenv("WASHEDMCP_SUMMARIZER_MODEL"):
        config.summarizer.model = summarizer_model

    if max_summary_len := os.getenv("WASHEDMCP_MAX_SUMMARY_LENGTH"):
        try:
            config.summarizer.max_summary_length = int(max_summary_len)
        except ValueError:
            pass

    # TOON formatter settings
    if max_code_lines := os.getenv("WASHEDMCP_MAX_CODE_LINES"):
        try:
            config.toon_formatter.max_code_lines = int(max_code_lines)
        except ValueError:
            pass

    # Search settings
    if default_top_k := os.getenv("WASHEDMCP_DEFAULT_TOP_K"):
        try:
            config.search.default_top_k = int(default_top_k)
        except ValueError:
            pass

    if default_depth := os.getenv("WASHEDMCP_DEFAULT_DEPTH"):
        try:
            config.search.default_depth = int(default_depth)
        except ValueError:
            pass

    # Global settings
    if debug := os.getenv("WASHEDMCP_DEBUG"):
        config.debug = debug.lower() in ("true", "1", "yes")

    if verbose := os.getenv("WASHEDMCP_VERBOSE"):
        config.verbose = verbose.lower() in ("true", "1", "yes")


def _load_from_yaml(config: WashedMCPConfig, path: Path) -> None:
    """Load configuration from a YAML file."""
    if not HAS_YAML:
        return

    try:
        with open(path, "r") as f:
            data = yaml.safe_load(f)

        if data:
            _apply_config_dict(config, data)
    except (OSError, yaml.YAMLError) as e:
        logger.debug("Could not load YAML config from %s: %s", path, e)


def _load_from_toml(config: WashedMCPConfig, path: Path) -> None:
    """Load configuration from a TOML file."""
    if not HAS_TOML:
        return

    try:
        with open(path, "rb") as f:
            data = tomllib.load(f)

        if data:
            _apply_config_dict(config, data)
    except (OSError, Exception) as e:
        logger.debug("Could not load TOML config from %s: %s", path, e)


def _apply_config_dict(config: WashedMCPConfig, data: Dict[str, Any]) -> None:
    """Apply a dictionary of configuration values to the config object."""

    # Parser config
    if parser_data := data.get("parser"):
        if ext_langs := parser_data.get("extension_languages"):
            config.parser.extension_languages = ext_langs

    # Indexer config
    if indexer_data := data.get("indexer"):
        if skip_dirs := indexer_data.get("skip_dirs"):
            config.indexer.skip_dirs = set(skip_dirs)
        if batch_size := indexer_data.get("batch_size"):
            config.indexer.batch_size = int(batch_size)
        if "skip_summarize_default" in indexer_data:
            config.indexer.skip_summarize_default = bool(indexer_data["skip_summarize_default"])

    # Database config
    if db_data := data.get("database"):
        if persist_dir := db_data.get("default_persist_dir"):
            config.database.default_persist_dir = persist_dir
        if persist_subdir := db_data.get("default_persist_subdir"):
            config.database.default_persist_subdir = persist_subdir
        if collection_name := db_data.get("collection_name"):
            config.database.collection_name = collection_name
        if distance_metric := db_data.get("distance_metric"):
            config.database.distance_metric = distance_metric
        if upsert_batch_size := db_data.get("upsert_batch_size"):
            config.database.upsert_batch_size = int(upsert_batch_size)

    # Embedder config
    if embedder_data := data.get("embedder"):
        if model_name := embedder_data.get("model_name"):
            config.embedder.model_name = model_name
        if embedding_dim := embedder_data.get("embedding_dimensions"):
            config.embedder.embedding_dimensions = int(embedding_dim)
        if "show_progress_bar" in embedder_data:
            config.embedder.show_progress_bar = bool(embedder_data["show_progress_bar"])

    # Summarizer config
    if summarizer_data := data.get("summarizer"):
        if model := summarizer_data.get("model"):
            config.summarizer.model = model
        if max_len := summarizer_data.get("max_summary_length"):
            config.summarizer.max_summary_length = int(max_len)
        if max_tokens := summarizer_data.get("max_tokens"):
            config.summarizer.max_tokens = int(max_tokens)
        if prompt := summarizer_data.get("prompt_template"):
            config.summarizer.prompt_template = prompt
        if fallback := summarizer_data.get("fallback_message"):
            config.summarizer.fallback_message = fallback

    # TOON formatter config
    if toon_data := data.get("toon_formatter"):
        if columns := toon_data.get("columns"):
            config.toon_formatter.columns = [tuple(c) for c in columns]
        if row_indent := toon_data.get("row_indent"):
            config.toon_formatter.row_indent = row_indent
        if col_sep := toon_data.get("column_separator"):
            config.toon_formatter.column_separator = col_sep
        if max_code := toon_data.get("max_code_lines"):
            config.toon_formatter.max_code_lines = int(max_code)

    # Search config
    if search_data := data.get("search"):
        if top_k := search_data.get("default_top_k"):
            config.search.default_top_k = int(top_k)
        if depth := search_data.get("default_depth"):
            config.search.default_depth = int(depth)
        if max_depth := search_data.get("max_depth"):
            config.search.max_depth = int(max_depth)

    # Global settings
    if "debug" in data:
        config.debug = bool(data["debug"])
    if "verbose" in data:
        config.verbose = bool(data["verbose"])


def _find_config_file() -> Optional[Path]:
    """Find a configuration file in standard locations."""

    # Check for config files in order of priority
    config_names = [
        "washedmcp.yaml",
        "washedmcp.yml",
        "washedmcp.toml",
        ".washedmcp.yaml",
        ".washedmcp.yml",
        ".washedmcp.toml",
    ]

    # Check current directory
    cwd = Path.cwd()
    for name in config_names:
        path = cwd / name
        if path.exists():
            return path

    # Check .washedmcp directory
    washedmcp_dir = cwd / ".washedmcp"
    if washedmcp_dir.exists():
        for name in ["config.yaml", "config.yml", "config.toml"]:
            path = washedmcp_dir / name
            if path.exists():
                return path

    # Check home directory
    home = Path.home()
    for name in config_names:
        path = home / name
        if path.exists():
            return path

    # Check XDG config directory
    xdg_config = Path(os.getenv("XDG_CONFIG_HOME", home / ".config"))
    washedmcp_config_dir = xdg_config / "washedmcp"
    if washedmcp_config_dir.exists():
        for name in ["config.yaml", "config.yml", "config.toml"]:
            path = washedmcp_config_dir / name
            if path.exists():
                return path

    return None


# =============================================================================
# Singleton Configuration Instance
# =============================================================================

_config: Optional[WashedMCPConfig] = None


def get_config(reload: bool = False) -> WashedMCPConfig:
    """
    Get the global configuration instance.

    Configuration is loaded once and cached. The loading order is:
    1. Default values (from dataclass defaults)
    2. Config file (YAML or TOML)
    3. Environment variables (highest priority)

    Args:
        reload: If True, force reload of configuration

    Returns:
        The WashedMCPConfig instance
    """
    global _config

    if _config is None or reload:
        _config = WashedMCPConfig()

        # Load from config file if found
        config_file = _find_config_file()
        if config_file:
            if config_file.suffix in (".yaml", ".yml"):
                _load_from_yaml(_config, config_file)
            elif config_file.suffix == ".toml":
                _load_from_toml(_config, config_file)

        # Load from environment (overrides file config)
        _load_from_env(_config)

    return _config


def load_config_from_file(path: str) -> WashedMCPConfig:
    """
    Load configuration from a specific file path.

    Args:
        path: Path to the configuration file (YAML or TOML)

    Returns:
        A new WashedMCPConfig instance with the loaded values
    """
    config = WashedMCPConfig()
    file_path = Path(path)

    if not file_path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")

    if file_path.suffix in (".yaml", ".yml"):
        if not HAS_YAML:
            raise ImportError("PyYAML is required to load YAML config files. Install with: pip install pyyaml")
        _load_from_yaml(config, file_path)
    elif file_path.suffix == ".toml":
        if not HAS_TOML:
            raise ImportError("tomli is required to load TOML config files. Install with: pip install tomli")
        _load_from_toml(config, file_path)
    else:
        raise ValueError(f"Unsupported config file format: {file_path.suffix}")

    # Still apply environment overrides
    _load_from_env(config)

    return config


def reset_config() -> None:
    """Reset the global configuration to None, forcing reload on next get_config()."""
    global _config
    _config = None


# =============================================================================
# Validation Functions
# =============================================================================

def validate_config(config: WashedMCPConfig) -> List[str]:
    """
    Validate the configuration and return a list of warnings/errors.

    Args:
        config: The configuration to validate

    Returns:
        List of warning/error messages (empty if valid)
    """
    issues = []

    # Validate indexer
    if config.indexer.batch_size < 1:
        issues.append("indexer.batch_size must be at least 1")
    if config.indexer.batch_size > 10000:
        issues.append("indexer.batch_size > 10000 may cause memory issues")

    # Validate database
    if config.database.distance_metric not in ("cosine", "l2", "ip"):
        issues.append(f"database.distance_metric must be 'cosine', 'l2', or 'ip', got '{config.database.distance_metric}'")
    if config.database.upsert_batch_size < 1:
        issues.append("database.upsert_batch_size must be at least 1")

    # Validate embedder
    if config.embedder.embedding_dimensions < 1:
        issues.append("embedder.embedding_dimensions must be at least 1")

    # Validate summarizer
    if config.summarizer.max_summary_length < 10:
        issues.append("summarizer.max_summary_length should be at least 10")
    if config.summarizer.max_tokens < 1:
        issues.append("summarizer.max_tokens must be at least 1")

    # Validate TOON formatter
    if config.toon_formatter.max_code_lines < 1:
        issues.append("toon_formatter.max_code_lines must be at least 1")

    # Validate search
    if config.search.default_top_k < 1:
        issues.append("search.default_top_k must be at least 1")
    if config.search.default_depth < 0:
        issues.append("search.default_depth cannot be negative")
    if config.search.max_depth < config.search.default_depth:
        issues.append("search.max_depth must be >= search.default_depth")

    return issues


# =============================================================================
# Main / Testing
# =============================================================================

if __name__ == "__main__":
    import json

    print("=" * 60)
    print("WashedMCP Configuration Module Test")
    print("=" * 60)

    # Get config
    config = get_config()

    print("\n1. Default Configuration:")
    print("-" * 40)
    print(f"  Parser extensions: {config.parser.extension_languages}")
    print(f"  Indexer skip_dirs: {config.indexer.skip_dirs}")
    print(f"  Indexer batch_size: {config.indexer.batch_size}")
    print(f"  Database persist_path: {config.database.default_persist_path}")
    print(f"  Database collection: {config.database.collection_name}")
    print(f"  Embedder model: {config.embedder.model_name}")
    print(f"  Embedder dimensions: {config.embedder.embedding_dimensions}")
    print(f"  Summarizer model: {config.summarizer.model}")
    print(f"  Summarizer max_length: {config.summarizer.max_summary_length}")
    print(f"  TOON max_code_lines: {config.toon_formatter.max_code_lines}")
    print(f"  Search default_top_k: {config.search.default_top_k}")
    print(f"  Search default_depth: {config.search.default_depth}")

    print("\n2. Validation:")
    print("-" * 40)
    issues = validate_config(config)
    if issues:
        print("  Issues found:")
        for issue in issues:
            print(f"    - {issue}")
    else:
        print("  Configuration is valid!")

    print("\n3. Config file detection:")
    print("-" * 40)
    config_file = _find_config_file()
    if config_file:
        print(f"  Found config file: {config_file}")
    else:
        print("  No config file found (using defaults + env vars)")

    print("\n4. Environment variable support:")
    print("-" * 40)
    print("  Supported env vars:")
    print("    WASHEDMCP_EXTENSION_LANGUAGES  - Format: '.py:python,.js:javascript'")
    print("    WASHEDMCP_SKIP_DIRS            - Comma-separated list")
    print("    WASHEDMCP_BATCH_SIZE           - Integer")
    print("    WASHEDMCP_PERSIST_PATH         - Path string")
    print("    WASHEDMCP_EMBEDDING_MODEL      - Model name string")
    print("    WASHEDMCP_SUMMARIZER_MODEL     - Model name string")
    print("    WASHEDMCP_MAX_SUMMARY_LENGTH   - Integer")
    print("    WASHEDMCP_MAX_CODE_LINES       - Integer")
    print("    WASHEDMCP_DEFAULT_TOP_K        - Integer")
    print("    WASHEDMCP_DEFAULT_DEPTH        - Integer")
    print("    WASHEDMCP_DEBUG                - true/false")
    print("    WASHEDMCP_VERBOSE              - true/false")

    print("\n" + "=" * 60)
    print("Test complete!")
