# WashedMCP Dockerfile
# Token-optimized semantic code search MCP server

# =============================================================================
# Stage 1: Build dependencies
# =============================================================================
FROM python:3.12-slim as builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
COPY pyproject.toml .
COPY setup.py .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install the package
COPY washedmcp/ ./washedmcp/
COPY README.md .
RUN pip install --no-cache-dir --upgrade pip wheel setuptools && \
    pip install --no-cache-dir .

# Pre-download the embedding model
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# =============================================================================
# Stage 2: Runtime image
# =============================================================================
FROM python:3.12-slim as runtime

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash washedmcp

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy pre-downloaded model from builder
COPY --from=builder /root/.cache/huggingface /home/washedmcp/.cache/huggingface

# Copy application code
COPY --chown=washedmcp:washedmcp washedmcp/ ./washedmcp/
COPY --chown=washedmcp:washedmcp pyproject.toml .

# Set ownership of cache
RUN chown -R washedmcp:washedmcp /home/washedmcp/.cache

# Switch to non-root user
USER washedmcp

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    WASHEDMCP_DATA_DIR=/data \
    HEALTH_PORT=8080

# Create data directory
RUN mkdir -p /data

# Expose health check port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -m washedmcp.health --check || exit 1

# Default command: run MCP server with health endpoint
ENTRYPOINT ["python", "-m", "washedmcp.mcp_server"]
CMD ["--with-health-server"]
