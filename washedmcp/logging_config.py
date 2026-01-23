"""
Logging configuration module for WashedMCP.

Provides a configured logger factory function with support for both
console and file output.

Usage:
    from .logging_config import get_logger
    logger = get_logger(__name__)

    logger.debug("Detailed debug information")
    logger.info("General information")
    logger.warning("Warning message")
    logger.error("Error message")
"""

import logging
import os
import sys
from typing import Optional


# Default log format
DEFAULT_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
DEFAULT_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Module-level state
_configured = False
_log_file_path: Optional[str] = None
_log_level = logging.INFO


def configure_logging(
    level: int = logging.INFO,
    log_file: Optional[str] = None,
    format_string: str = DEFAULT_FORMAT,
    date_format: str = DEFAULT_DATE_FORMAT
) -> None:
    """
    Configure the root logger for WashedMCP.

    This should be called once at application startup. If not called,
    get_logger() will use sensible defaults.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
        log_file: Optional path to log file. If provided, logs will be
                  written to both console and file.
        format_string: Log message format string
        date_format: Date format string for timestamps
    """
    global _configured, _log_file_path, _log_level

    _log_level = level
    _log_file_path = log_file

    # Get the root logger for washedmcp
    root_logger = logging.getLogger("washedmcp")
    root_logger.setLevel(level)

    # Remove existing handlers to avoid duplicates
    root_logger.handlers.clear()

    # Create formatter
    formatter = logging.Formatter(format_string, datefmt=date_format)

    # Console handler - outputs to stderr
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File handler (optional)
    if log_file:
        # Ensure log directory exists
        log_dir = os.path.dirname(log_file)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)

        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    _configured = True


def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger for the given module name.

    Args:
        name: Module name (typically __name__)

    Returns:
        Configured logging.Logger instance

    Example:
        from .logging_config import get_logger
        logger = get_logger(__name__)
        logger.info("This is an info message")
    """
    global _configured

    # Auto-configure with defaults if not explicitly configured
    if not _configured:
        # Check environment for log level
        env_level = os.environ.get("WASHEDMCP_LOG_LEVEL", "INFO").upper()
        level_map = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARNING": logging.WARNING,
            "WARN": logging.WARNING,
            "ERROR": logging.ERROR,
        }
        level = level_map.get(env_level, logging.INFO)

        # Check environment for log file
        log_file = os.environ.get("WASHEDMCP_LOG_FILE")

        configure_logging(level=level, log_file=log_file)

    # If the name doesn't start with washedmcp, prefix it
    if not name.startswith("washedmcp"):
        name = f"washedmcp.{name}"

    return logging.getLogger(name)


def set_log_level(level: int) -> None:
    """
    Dynamically change the log level for all WashedMCP loggers.

    Args:
        level: New logging level (DEBUG, INFO, WARNING, ERROR)
    """
    global _log_level
    _log_level = level

    root_logger = logging.getLogger("washedmcp")
    root_logger.setLevel(level)

    for handler in root_logger.handlers:
        handler.setLevel(level)


def get_log_level() -> int:
    """
    Get the current log level.

    Returns:
        Current logging level
    """
    return _log_level


# Convenience functions for one-time log level setting
def set_debug() -> None:
    """Set log level to DEBUG."""
    set_log_level(logging.DEBUG)


def set_info() -> None:
    """Set log level to INFO."""
    set_log_level(logging.INFO)


def set_warning() -> None:
    """Set log level to WARNING."""
    set_log_level(logging.WARNING)


def set_error() -> None:
    """Set log level to ERROR."""
    set_log_level(logging.ERROR)


if __name__ == "__main__":
    # Test the logging configuration
    print("Testing logging configuration...")

    # Configure with DEBUG level
    configure_logging(level=logging.DEBUG)

    # Get loggers for different modules
    logger1 = get_logger("parser")
    logger2 = get_logger("washedmcp.database")
    logger3 = get_logger(__name__)

    # Test all log levels
    logger1.debug("This is a debug message from parser")
    logger1.info("This is an info message from parser")
    logger1.warning("This is a warning message from parser")
    logger1.error("This is an error message from parser")

    logger2.info("This is an info message from database")
    logger3.info("This is an info message from logging_config")

    # Test exception logging
    try:
        raise ValueError("Test exception")
    except ValueError:
        logger1.exception("Caught an exception")

    print("\nLogging test complete!")
