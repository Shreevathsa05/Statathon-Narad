# Narad Traces - Docker Setup

This is a complete Docker Compose setup for running the Langfuse observability platform along with supporting services.

## Services & Ports

All services are bound to **localhost (127.0.0.1)** for local machine access only, except where noted.

| Service | Port | URL | Access |
|---------|------|-----|--------|
| **Langfuse Web UI** | 3000 | `http://localhost:3000` | Main web interface for Langfuse |
| **Langfuse Worker** | 3030 | `http://localhost:3030` | Background job processor |
| **Grafana** | 4040 | `http://localhost:4040` | Monitoring and visualization |
| **Minio API** | 9090 | `http://localhost:9090` | S3-compatible object storage API |
| **Minio Console** | 9091 | `http://localhost:9091` | Minio web UI for bucket management |
| **Redis** | 6379 | `localhost:6379` | In-memory data store (internal) |
| **PostgreSQL** | 5432 | `localhost:5432` | Main database (internal) |
| **ClickHouse HTTP** | 8123 | `http://localhost:8123` | Analytics database HTTP interface |
| **ClickHouse TCP** | 9000 | `localhost:9000` | Analytics database native protocol |
| **Prometheus** | 8080 | `http://localhost:8080` | Metrics collection (mapped from 9090) |

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Port 3000 available (Langfuse Web)

### Starting Services

```bash
docker compose up -d
```

### Stopping Services

```bash
docker compose down
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f langfuse-web
```

## Service Access & Credentials

### Langfuse Web UI
- **URL**: http://localhost:3000
- **Purpose**: Main interface for managing traces, projects, and settings

### Minio (S3 Storage)
- **API Endpoint**: http://localhost:9090
- **Console URL**: http://localhost:9091
- **Default Username**: `minio`
- **Default Password**: Configure in `.env` (`MINIO_ROOT_PASSWORD`)
- **Purpose**: Object storage for trace files and media uploads

### Grafana (Monitoring Dashboard)
- **URL**: http://localhost:4040
- **Default Username**: `admin`
- **Default Password**: Configure in `.env` (`GF_SECURITY_ADMIN_PASSWORD`)
- **Purpose**: Visualize metrics and create monitoring dashboards

### Redis (Cache)
- **Endpoint**: `localhost:6379`
- **Password**: Configure in `.env` (`REDIS_AUTH`)
- **Purpose**: Session cache and real-time data storage

### PostgreSQL (Database)
- **Endpoint**: `localhost:5432`
- **Username**: Configure in `.env` (`POSTGRES_USER`)
- **Password**: Configure in `.env` (`POSTGRES_PASSWORD`)
- **Database**: Configure in `.env` (`POSTGRES_DB`)
- **Purpose**: Main relational database

### ClickHouse (Analytics)
- **HTTP Interface**: http://localhost:8123
- **Native Port**: `localhost:9000`
- **Username**: Configure in `.env` (`CLICKHOUSE_USER`)
- **Password**: Configure in `.env` (`CLICKHOUSE_PASSWORD`)
- **Purpose**: Analytics and time-series data storage

### Prometheus (Metrics)
- **URL**: http://localhost:8080
- **Config File**: `prometheus.yml`
- **Purpose**: Collects metrics from all services

## Environment Configuration

All environment variables are centralized in the `.env` file. Key variables:

```env
# Langfuse Security
NEXTAUTH_SECRET=mysecret          # CHANGEME: Secure token for authentication
ENCRYPTION_KEY=...                 # CHANGEME: 32-byte hex encryption key

# Credentials
POSTGRES_PASSWORD=postgres         # CHANGEME
CLICKHOUSE_PASSWORD=clickhouse     # CHANGEME
REDIS_AUTH=myredissecret          # CHANGEME
MINIO_ROOT_PASSWORD=miniosecret   # CHANGEME
GF_SECURITY_ADMIN_PASSWORD=admin  # CHANGEME
```

**⚠️ Important**: Change all `# CHANGEME` values in `.env` before deploying to production.

## Generating Secure Credentials

### Generate a 32-byte Encryption Key
```bash
openssl rand -hex 32
```

### Generate a Secure Random Secret
```bash
openssl rand -base64 32
```

## Volumes & Data Persistence

All data is stored in Docker volumes:

| Service | Volume | Purpose |
|---------|--------|---------|
| PostgreSQL | `langfuse_postgres_data` | Main database files |
| ClickHouse | `langfuse_clickhouse_data` | Analytics data |
| ClickHouse | `langfuse_clickhouse_logs` | Application logs |
| Minio | `langfuse_minio_data` | S3 bucket storage |
| Redis | `langfuse_redis_data` | Cache data |
| Grafana | `langfuse_grafana_data` | Dashboards and datasources |

### Backing Up Data
```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U postgres postgres > backup.sql

# Backup Minio (copy volume)
docker run --rm -v langfuse_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz /data
```

## Networking

- **Internal Communication**: Services communicate via service names (e.g., `redis:6379`, `postgres:5432`)
- **External Access**: Bound to `127.0.0.1` (localhost only)
- **Network**: All services are on the `default` Docker Compose network

## Troubleshooting

### Service Won't Start
```bash
# Check service logs
docker compose logs [service-name]

# Verify port availability
netstat -an | grep LISTEN
```

### Connectivity Issues
```bash
# Test connection to service
docker compose exec langfuse-web curl http://postgres:5432

# Check DNS resolution
docker compose exec langfuse-web nslookup redis
```

### Reset All Data
```bash
# Remove all volumes and containers
docker compose down -v

# Restart from scratch
docker compose up -d
```

## Production Considerations

1. **Change all default credentials** in `.env`
2. **Use strong encryption keys** (run: `openssl rand -hex 32`)
3. **Use environment-specific `.env` files** (e.g., `.env.prod`)
4. **Update service endpoints** if running on different machines
5. **Configure firewall rules** to restrict access
6. **Set up SSL/TLS** for external access
7. **Monitor resource usage** and adjust container limits
8. **Set up automated backups** for critical volumes

## Monitoring & Logs

### View Real-time Logs
```bash
docker compose logs -f langfuse-web
```

### Access Prometheus Metrics
- UI: http://localhost:8080
- Query format: `http://localhost:8080/api/v1/query?query=<metric_name>`

### View Grafana Dashboards
- UI: http://localhost:3030
- Add Prometheus as a data source

## Support & Documentation

- **Langfuse Docs**: https://langfuse.com/docs
- **Docker Compose**: https://docs.docker.com/compose/
- **Minio Docs**: https://min.io/docs/
- **Grafana Docs**: https://grafana.com/docs/
