# ClinikChat

A self-hosted team messenger with web PWA and Android APK support.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:dev

# Copy env file and configure
cp docker/.env.example .env

# Run database migrations
cd packages/api && pnpm prisma migrate dev

# Start all packages in dev mode
pnpm dev
```

## Project Structure

```
packages/
  api/       — Express + Prisma + Socket.IO backend
  web/       — React + Vite + Tailwind frontend
  mobile/    — React Native Expo app (future)
  shared/    — Shared TypeScript types, schemas, utilities
docker/      — Docker Compose configs for dev and prod
docs/        — Documentation
```
