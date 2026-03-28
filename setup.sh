#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║        ClinikChat Setup Script           ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

generate_password() {
    openssl rand -base64 32 | tr -d '=/+' | head -c 32
}

# Interactive prompts
read -rp "Domain name (e.g., chat.example.com) [localhost]: " DOMAIN
DOMAIN="${DOMAIN:-localhost}"

read -rp "Admin email (for notifications) [admin@${DOMAIN}]: " ADMIN_EMAIL
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${DOMAIN}}"

echo ""
echo -e "${YELLOW}Generating secure passwords...${NC}"

POSTGRES_PASSWORD=$(generate_password)
JWT_SECRET=$(generate_password)
JWT_REFRESH_SECRET=$(generate_password)
MINIO_ROOT_PASSWORD=$(generate_password)

if [ "$DOMAIN" = "localhost" ]; then
    CORS_ORIGIN="http://localhost"
    PROTOCOL="http"
else
    CORS_ORIGIN="https://${DOMAIN}"
    PROTOCOL="https"
fi

ENV_FILE="docker/.env.production"

cat > "$ENV_FILE" <<EOF
# ClinikChat Production — generated $(date -u +"%Y-%m-%dT%H:%M:%SZ")
DOMAIN=${DOMAIN}

# PostgreSQL
POSTGRES_USER=clinikchat
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=clinikchat

# MinIO / S3
MINIO_ROOT_USER=clinikchat-minio
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# CORS
CORS_ORIGIN=${CORS_ORIGIN}

# Ports
HTTP_PORT=80
HTTPS_PORT=443
EOF

echo -e "${GREEN}✓ Environment file created: ${ENV_FILE}${NC}"

echo ""
echo -e "${YELLOW}Building Docker images...${NC}"
docker compose -f docker/docker-compose.prod.yml --env-file "$ENV_FILE" build

echo ""
echo -e "${YELLOW}Starting services...${NC}"
docker compose -f docker/docker-compose.prod.yml --env-file "$ENV_FILE" up -d

echo ""
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

for i in {1..30}; do
    if docker compose -f docker/docker-compose.prod.yml --env-file "$ENV_FILE" ps | grep -q "(healthy)"; then
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 5
done

echo ""
echo -e "${YELLOW}Running database migrations...${NC}"
docker compose -f docker/docker-compose.prod.yml --env-file "$ENV_FILE" exec api \
    npx prisma migrate deploy 2>/dev/null || \
    echo -e "${YELLOW}  (No migrations to run yet — run 'prisma migrate dev' locally first to create migrations)${NC}"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗"
echo -e "║         ClinikChat is running!            ║"
echo -e "╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}URL:${NC}       ${PROTOCOL}://${DOMAIN}"
echo -e "  ${CYAN}Admin:${NC}     ${ADMIN_EMAIL}"
echo ""
echo -e "  ${YELLOW}Important:${NC} Save your credentials from ${ENV_FILE}"
echo -e "  ${YELLOW}SSL:${NC}       See docs/SELF_HOSTING.md for Let's Encrypt setup"
echo ""
