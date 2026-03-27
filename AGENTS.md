## Cursor Cloud specific instructions

ClinikChat is a pnpm monorepo (`packages/api`, `packages/web`, `packages/mobile`, `packages/shared`).

### Install dependencies

From the repository root:

```bash
corepack enable pnpm
pnpm install
```

For the API, copy `packages/api/.env.example` to `packages/api/.env` and set secrets (JWT secrets must be at least 32 characters). For local databases, start Docker services from `docker/docker-compose.dev.yml` and align `DATABASE_URL` with `docker/.env.example`.

### Build

```bash
pnpm build
```

`@clinikchat/shared` emits to `packages/shared/dist`. The API runs `prisma generate` then compiles TypeScript to `packages/api/dist`. The web app runs `tsc -b` and `vite build` to `packages/web/dist`.

### Development

- **All packages (parallel):** `pnpm dev` — runs API (`tsx watch`), web (`vite`), shared (`tsc --watch`), and mobile placeholder script.
- **API only:** `pnpm --filter @clinikchat/api dev`
- **Web only:** `pnpm --filter @clinikchat/web dev`

Start Postgres/Redis/MinIO first:

```bash
docker compose -f docker/docker-compose.dev.yml --env-file docker/.env.example up -d
```

Then apply Prisma migrations when the database is up (not run in this scaffold by default):

```bash
pnpm --filter @clinikchat/api exec prisma migrate dev
```

### Lint and typecheck

```bash
pnpm lint
pnpm typecheck
```

### Tests

No automated test suite is wired yet; add a runner (e.g. Vitest/Jest) in a later phase.

### Caveats

- There is no `.cursorrules` file in this repository root; conventions follow the shared strict TypeScript and ESLint setup.
- The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:3001` (see `packages/web/vite.config.ts`).
- `packages/mobile` is a placeholder package until React Native / Expo is added.
