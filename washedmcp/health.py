"""
WashedMCP Health Check Module

Provides health check functionality for monitoring and orchestration:
- CLI health check command (for Docker HEALTHCHECK)
- HTTP health server (for Kubernetes probes)
- Component status checks (ChromaDB, embedding model)
"""

import argparse
import json
import os
import sys
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Optional


# Global health status
_health_status = {
    "status": "unknown",
    "components": {
        "chromadb": {"status": "unknown"},
        "embedding_model": {"status": "unknown"},
    },
    "version": "0.1.0",
}
_status_lock = threading.Lock()


def check_chromadb() -> dict:
    """Check ChromaDB connection and status."""
    try:
        from .database import init_db, get_stats

        # Get data directory from environment or default
        data_dir = os.environ.get("WASHEDMCP_DATA_DIR", "./.washedmcp")
        persist_path = os.path.join(data_dir, "chroma")

        init_db(persist_path=persist_path)
        stats = get_stats()

        return {
            "status": "healthy",
            "message": f"Connected, {stats['total_functions']} functions indexed",
            "details": stats,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": str(e),
        }


def check_embedding_model() -> dict:
    """Check if embedding model is loaded and functional."""
    try:
        from .embedder import embed_query

        # Try to generate a simple embedding
        test_embedding = embed_query("test")

        if len(test_embedding) == 384:
            return {
                "status": "healthy",
                "message": "Model loaded and functional",
                "details": {"embedding_dimensions": 384},
            }
        else:
            return {
                "status": "unhealthy",
                "message": f"Unexpected embedding dimensions: {len(test_embedding)}",
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": str(e),
        }


def get_health_status(full_check: bool = False) -> dict:
    """
    Get overall health status.

    Args:
        full_check: If True, performs full component checks.
                   If False, returns cached status (faster).

    Returns:
        Health status dictionary.
    """
    global _health_status

    if full_check:
        with _status_lock:
            chromadb_status = check_chromadb()
            model_status = check_embedding_model()

            _health_status["components"]["chromadb"] = chromadb_status
            _health_status["components"]["embedding_model"] = model_status

            # Overall status is healthy only if all components are healthy
            all_healthy = all(
                comp["status"] == "healthy"
                for comp in _health_status["components"].values()
            )
            _health_status["status"] = "healthy" if all_healthy else "unhealthy"

    return _health_status.copy()


def is_healthy() -> bool:
    """Quick check if the service is healthy."""
    status = get_health_status(full_check=True)
    return status["status"] == "healthy"


class HealthHandler(BaseHTTPRequestHandler):
    """HTTP handler for health check endpoints."""

    def log_message(self, format, *args):
        """Suppress default logging."""
        pass

    def _send_json_response(self, status_code: int, data: dict):
        """Send a JSON response."""
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())

    def do_GET(self):
        """Handle GET requests."""
        if self.path == "/health":
            # Full health check
            status = get_health_status(full_check=True)
            status_code = 200 if status["status"] == "healthy" else 503
            self._send_json_response(status_code, status)

        elif self.path == "/health/live":
            # Liveness probe (is the process running?)
            self._send_json_response(200, {"status": "alive"})

        elif self.path == "/health/ready":
            # Readiness probe (is the service ready to accept traffic?)
            status = get_health_status(full_check=True)
            status_code = 200 if status["status"] == "healthy" else 503
            self._send_json_response(status_code, {
                "status": "ready" if status["status"] == "healthy" else "not_ready",
                "details": status["components"]
            })

        else:
            self.send_error(404, "Not Found")


class HealthServer:
    """HTTP server for health checks."""

    def __init__(self, port: int = 8080, host: str = "0.0.0.0"):
        self.port = port
        self.host = host
        self.server: Optional[HTTPServer] = None
        self._thread: Optional[threading.Thread] = None

    def start(self):
        """Start the health server in a background thread."""
        self.server = HTTPServer((self.host, self.port), HealthHandler)
        self._thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self._thread.start()
        print(f"Health server started on http://{self.host}:{self.port}")

    def stop(self):
        """Stop the health server."""
        if self.server:
            self.server.shutdown()
            self.server = None
        if self._thread:
            self._thread.join(timeout=5)
            self._thread = None


# Global health server instance
_health_server: Optional[HealthServer] = None


def start_health_server(port: int = 8080) -> HealthServer:
    """Start the global health server."""
    global _health_server
    if _health_server is None:
        _health_server = HealthServer(port=port)
        _health_server.start()
    return _health_server


def stop_health_server():
    """Stop the global health server."""
    global _health_server
    if _health_server:
        _health_server.stop()
        _health_server = None


def cli_health_check() -> int:
    """
    CLI health check command.

    Returns:
        0 if healthy, 1 if unhealthy.
    """
    try:
        status = get_health_status(full_check=True)
        print(json.dumps(status, indent=2))
        return 0 if status["status"] == "healthy" else 1
    except Exception as e:
        print(json.dumps({
            "status": "unhealthy",
            "error": str(e)
        }, indent=2))
        return 1


def main():
    """Main entry point for health module."""
    parser = argparse.ArgumentParser(description="WashedMCP Health Check")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Run health check and exit (for Docker HEALTHCHECK)"
    )
    parser.add_argument(
        "--server",
        action="store_true",
        help="Start health check HTTP server"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("HEALTH_PORT", 8080)),
        help="Port for health server (default: 8080)"
    )

    args = parser.parse_args()

    if args.check:
        sys.exit(cli_health_check())
    elif args.server:
        server = HealthServer(port=args.port)
        server.start()
        try:
            # Keep running until interrupted
            import time
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            server.stop()
    else:
        # Default: run health check
        sys.exit(cli_health_check())


if __name__ == "__main__":
    main()
