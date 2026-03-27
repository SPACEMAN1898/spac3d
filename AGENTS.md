## Cursor Cloud specific instructions

### Install
- Run `pnpm install` from the repository root.
- Generate the Prisma client with `pnpm --filter @clinikchat/api prisma:generate`.

### Run
- Start local infrastructure with `pnpm docker:dev`.
- Run the API with `pnpm --filter @clinikchat/api dev`.
- Run the web client with `pnpm --filter @clinikchat/web dev`.

### Build, lint, and test
- Build all packages with `pnpm build`.
- Lint all packages with `pnpm lint`.
- Typecheck all packages with `pnpm typecheck`.

### Caveats
- The repo-level `.cursorrules` file is currently absent, so follow direct user instructions plus this file.
- `packages/mobile` is scaffolded only in Phase 0 and does not yet contain an Expo app.
- Docker services use `docker/.env.example` as the default env file for local development.
