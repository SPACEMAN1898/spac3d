# Self-Hosting ClinikChat

Host your own ClinikChat instance with Docker Compose.

## System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM      | 2 GB    | 4 GB        |
| CPU      | 2 cores | 4 cores     |
| Disk     | 20 GB   | 50 GB       |
| OS       | Linux (Ubuntu 22.04+), macOS, Windows 10+ |

**Required software:**
- Docker Engine 24+ and Docker Compose v2
- Git

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/SPACEMAN1898/spac3d.git clinikchat
cd clinikchat

# 2. Run the setup script
chmod +x setup.sh
./setup.sh

# 3. Open your browser
# → http://localhost (or your configured domain)
```

**Windows:**
```powershell
git clone https://github.com/SPACEMAN1898/spac3d.git clinikchat
cd clinikchat
.\setup.ps1
```

The setup script will:
- Ask for your domain name and admin email
- Generate secure random passwords
- Create a `.env.production` file
- Build and start all Docker containers
- Run database migrations

## Configuration Reference

All configuration is in `docker/.env.production`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DOMAIN` | Your domain name | `localhost` |
| `POSTGRES_USER` | Database username | `clinikchat` |
| `POSTGRES_PASSWORD` | Database password | (generated) |
| `POSTGRES_DB` | Database name | `clinikchat` |
| `MINIO_ROOT_USER` | MinIO admin username | `clinikchat-minio` |
| `MINIO_ROOT_PASSWORD` | MinIO admin password | (generated) |
| `JWT_SECRET` | JWT signing secret | (generated) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (generated) |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost` |
| `HTTP_PORT` | HTTP port | `80` |
| `HTTPS_PORT` | HTTPS port | `443` |

## SSL/TLS with Let's Encrypt

### Using Certbot

```bash
# Install certbot
sudo apt install certbot

# Get certificate (stop nginx first)
docker compose -f docker/docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d your-domain.com
docker compose -f docker/docker-compose.prod.yml start nginx
```

### Enable SSL in nginx config

1. Edit `docker/nginx/nginx.prod.conf`
2. Uncomment the SSL server block at the bottom
3. Replace `YOUR_DOMAIN` with your domain
4. Uncomment the SSL redirect in the port-80 server block
5. Uncomment the Let's Encrypt volume mount in `docker-compose.prod.yml`
6. Restart nginx: `docker compose -f docker/docker-compose.prod.yml restart nginx`

### Auto-renewal

```bash
# Add to crontab
echo "0 3 * * * certbot renew --quiet && docker compose -f /path/to/docker/docker-compose.prod.yml restart nginx" | sudo tee -a /etc/crontab
```

## Backup and Restore

### Database Backup

```bash
# Create backup
docker compose -f docker/docker-compose.prod.yml exec postgres \
  pg_dump -U clinikchat clinikchat > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose -f docker/docker-compose.prod.yml exec -T postgres \
  psql -U clinikchat clinikchat < backup_20240101.sql
```

### MinIO (File Storage) Backup

```bash
# Backup MinIO data volume
docker run --rm -v clinikchat-minio-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/minio_backup_$(date +%Y%m%d).tar.gz /data

# Restore
docker run --rm -v clinikchat-minio-data:/data -v $(pwd):/backup \
  alpine sh -c "cd / && tar xzf /backup/minio_backup_20240101.tar.gz"
```

### Full Backup Script

```bash
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Database
docker compose -f docker/docker-compose.prod.yml exec -T postgres \
  pg_dump -U clinikchat clinikchat > "$BACKUP_DIR/database.sql"

# MinIO
docker run --rm -v clinikchat-minio-data:/data -v "$BACKUP_DIR":/backup \
  alpine tar czf /backup/minio.tar.gz /data

echo "Backup saved to $BACKUP_DIR"
```

## Updating to New Versions

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.production build
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.production up -d

# Run any new migrations
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.production exec api \
  npx prisma migrate deploy
```

## Managing Services

```bash
# View logs
docker compose -f docker/docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker/docker-compose.prod.yml logs -f api

# Restart a service
docker compose -f docker/docker-compose.prod.yml restart api

# Stop all services
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.production down

# Stop and remove volumes (WARNING: deletes all data)
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.production down -v
```

## Troubleshooting

### Services won't start
```bash
# Check container status
docker compose -f docker/docker-compose.prod.yml ps

# Check logs for errors
docker compose -f docker/docker-compose.prod.yml logs --tail=50
```

### Database connection issues
```bash
# Verify postgres is healthy
docker compose -f docker/docker-compose.prod.yml exec postgres pg_isready

# Check DATABASE_URL in api container
docker compose -f docker/docker-compose.prod.yml exec api env | grep DATABASE
```

### API returns 502
The API container may still be starting. Wait 30 seconds and retry. Check API logs:
```bash
docker compose -f docker/docker-compose.prod.yml logs api
```

### WebSocket connection fails
Ensure nginx is properly configured for WebSocket upgrade. Check `docker/nginx/nginx.prod.conf` has the `/socket.io/` location block with `proxy_set_header Upgrade`.

### Out of disk space
```bash
# Clean Docker build cache
docker system prune -f
docker builder prune -f
```
