## Cursor Cloud specific instructions

This is a **pnpm monorepo** for ClinikChat — a self-hosted team messenger.

### Repository structure

```
packages/
  api/       Node.js + Express + Socket.IO + Prisma backend
  web/       React + Vite + Tailwind CSS frontend (PWA)
  mobile/    React Native + Expo (future phase)
  shared/    Shared TypeScript types, Zod schemas, constants, utilities
docker/      Docker Compose configs for dev and prod
docs/        Documentation
```

### Installing dependencies

```bash
pnpm install
```

### Running the application

```bash
# Start Docker infrastructure (PostgreSQL 16, Redis 7, MinIO)
pnpm docker:dev
# or: docker compose -f docker/docker-compose.dev.yml up -d

# Copy environment variables
cp docker/.env.example .env

# Run DB migrations (requires DB to be up)
pnpm --filter api prisma:migrate

# Start all services in dev mode (parallel)
pnpm dev

# Or individually:
pnpm --filter api dev      # Express API on port 3000
pnpm --filter web dev      # Vite dev server on port 5173
```

### Building

```bash
pnpm build                 # Build all packages
pnpm --filter web build    # Build web only
pnpm --filter api build    # Build API (TSC) only
```

### TypeScript checking

```bash
pnpm typecheck             # Check all packages
pnpm --filter shared typecheck
pnpm --filter api typecheck
pnpm --filter web typecheck
```

### Linting

```bash
pnpm lint
```

### Prisma

```bash
pnpm --filter api prisma:generate   # Regenerate Prisma client
pnpm --filter api prisma:migrate    # Run migrations (DB must be up)
pnpm --filter api prisma:studio     # Prisma Studio (DB must be up)
```

### Environment variables

See `docker/.env.example` for all required environment variables. Copy to `.env` at the root.

Key env vars for `packages/api`:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection URL
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — JWT signing secrets
- `CORS_ORIGIN` — Allowed CORS origin (e.g., http://localhost:5173)
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` — MinIO/S3 config

### Non-obvious caveats

- The `shared` package is consumed as a workspace dependency via TypeScript source paths (not compiled). The `vite.config.ts` and `tsconfig.json` files in `web` and `api` have path aliases pointing to `../shared/src/index.ts`.
- `exactOptionalPropertyTypes: true` is set in `tsconfig.base.json`. Use `property?: Type | undefined` (not just `property?: Type`) when the interface needs to be compatible with React Hook Form or similar libraries.
- Prisma creates its generated client in the root `node_modules/.pnpm/...` path under pnpm. Run `pnpm --filter api prisma:generate` after any schema changes.
- The `pnpm` field in root `package.json` contains `onlyBuiltDependencies` to allow Prisma and esbuild build scripts.
