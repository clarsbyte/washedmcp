# WashedMCP Deployment Guide

## Quick Start

### Docker

```bash
# Build the image
docker build -t washedmcp:latest .

# Run with health server
docker run -d \
  --name washedmcp \
  -v washedmcp-data:/data \
  -v /path/to/your/codebase:/codebase:ro \
  -p 8080:8080 \
  washedmcp:latest --with-health-server

# Check health
curl http://localhost:8080/health
```

### Docker Compose

```bash
# Set your codebase path
export CODEBASE_PATH=/path/to/your/codebase

# Start the service
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

### Kubernetes

```bash
# Apply manifests
kubectl apply -f deploy/kubernetes.yaml

# Check status
kubectl -n washedmcp get pods

# Port-forward
kubectl -n washedmcp port-forward svc/washedmcp 8080:8080
```

## Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Full health status |
| `/health/live` | Liveness probe |
| `/health/ready` | Readiness probe |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WASHEDMCP_DATA_DIR` | ChromaDB data directory | `/data` |
| `ANTHROPIC_API_KEY` | API key for summarization | (optional) |
| `HEALTH_PORT` | Health server port | `8080` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Resource Requirements

| | Minimum | Recommended |
|---|---------|-------------|
| Memory | 512MB | 2GB |
| CPU | 0.25 cores | 1 core |
| Disk | 1GB | 10GB |
