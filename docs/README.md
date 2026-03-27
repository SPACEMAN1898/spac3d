# ClinikChat

A self-hosted team messenger (like Slack) with web PWA + Android APK support.

## Architecture

- **packages/api** — Node.js + Express + Socket.IO + Prisma (PostgreSQL)
- **packages/web** — React + Vite + Tailwind CSS (PWA)
- **packages/mobile** — React Native + Expo (Android APK)
- **packages/shared** — Shared TypeScript types, Zod schemas, constants, utilities

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker + Docker Compose

### Development Setup

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:dev

# Copy env example
cp docker/.env.example .env

# Run database migrations
pnpm --filter api prisma migrate dev

# Start all services in parallel
pnpm dev
```

### Individual Services

```bash
# API only
pnpm --filter api dev

# Web only
pnpm --filter web dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all packages in dev mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript type check all packages |
| `pnpm docker:dev` | Start Docker infrastructure |
| `pnpm docker:down` | Stop Docker infrastructure |
