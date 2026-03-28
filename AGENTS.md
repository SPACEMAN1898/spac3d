## Cursor Cloud specific instructions

### Project Overview
ClinikChat — pnpm monorepo with 4 packages: `api`, `web`, `mobile`, `shared`.

### Install Dependencies
```bash
pnpm install
```

### Build
```bash
pnpm build       # Build all packages
```

### Dev
```bash
pnpm docker:dev  # Start PostgreSQL, Redis, MinIO
pnpm dev         # Start all packages in watch mode
```

### Typecheck
```bash
pnpm typecheck   # Typecheck all packages
```

### Lint
```bash
pnpm lint        # Lint all packages
```

### Test
No automated test framework configured yet. Use `pnpm typecheck` and `pnpm build` as primary checks.

### Production
```bash
./setup.sh                                                          # Interactive setup
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.production up -d  # Manual start
```

### Package-level Commands
```bash
# API
cd packages/api && pnpm dev              # Run API in watch mode
cd packages/api && pnpm prisma:generate  # Regenerate Prisma client
cd packages/api && pnpm prisma:migrate   # Run DB migrations

# Web
cd packages/web && pnpm dev              # Run Vite dev server

# Shared
cd packages/shared && pnpm build         # Build shared types

# Mobile
cd packages/mobile && pnpm start         # Expo dev server
```

### Important Notes
- Always build `packages/shared` before typechecking `packages/web` or `packages/api` (shared dist/ must exist).
- Prisma schema is at `packages/api/prisma/schema.prisma`.
- The `packages/mobile` package requires Expo Go or EAS Build to run.
- Production Dockerfiles are at `packages/api/Dockerfile` and `packages/web/Dockerfile`.
