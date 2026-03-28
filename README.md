# ClinikChat

A self-hosted team messenger with web PWA and Android APK — like Slack, but yours.

## Features

- **Real-time messaging** — Socket.IO powered instant messaging with typing indicators
- **Organizations & channels** — Public, private, and direct message channels
- **File sharing** — Drag-and-drop uploads with image previews and lightbox
- **Emoji reactions** — React to messages with quick emoji picker
- **Full-text search** — PostgreSQL-powered search across message history
- **PWA support** — Install as a desktop/mobile app from the browser
- **Mobile app** — React Native (Expo) app for Android with push notifications
- **Self-hosted** — Docker Compose deployment, your data stays on your server

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **API** | Node.js, Express, Socket.IO, Prisma, PostgreSQL |
| **Web** | React, Vite, Tailwind CSS, Zustand, React Query |
| **Mobile** | React Native, Expo, expo-router, nativewind |
| **Shared** | TypeScript types, Zod schemas, constants |
| **Storage** | MinIO (S3-compatible) for file uploads |
| **Cache** | Redis |
| **Proxy** | Nginx reverse proxy with WebSocket support |

## Quick Start — Self Hosting

```bash
git clone https://github.com/SPACEMAN1898/spac3d.git clinikchat
cd clinikchat
./setup.sh
```

See [Self-Hosting Guide](docs/SELF_HOSTING.md) for full details including SSL setup.

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Getting Started

```bash
# Install dependencies
pnpm install

# Start dev infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:dev

# Copy and configure environment
cp docker/.env.example .env

# Generate Prisma client and run migrations
cd packages/api
pnpm prisma:generate
pnpm prisma:migrate
cd ../..

# Build shared types
pnpm --filter @clinikchat/shared build

# Start all services in dev mode
pnpm dev
```

The web client runs at `http://localhost:5173` and the API at `http://localhost:3001`.

### Project Structure

```
packages/
  api/       — Express + Prisma + Socket.IO backend
  web/       — React + Vite + Tailwind PWA frontend
  mobile/    — React Native Expo app
  shared/    — Shared TypeScript types, Zod schemas, utilities
docker/      — Docker Compose configs for dev and prod
docs/        — Documentation
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in watch mode |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm docker:dev` | Start dev infrastructure |
| `pnpm docker:down` | Stop dev infrastructure |

### Mobile Development

```bash
cd packages/mobile
pnpm start          # Start Expo dev server
pnpm android        # Run on Android
pnpm build:apk      # Build APK via EAS
```

## API Overview

All endpoints are prefixed with `/api/v1`. Authentication uses JWT Bearer tokens.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Sign in |
| POST | `/auth/refresh` | Refresh token |
| GET | `/users/me` | Current user |
| GET | `/orgs` | List organizations |
| GET | `/orgs/:id/channels` | List channels |
| GET | `/channels/:id/messages` | Message history |
| POST | `/channels/:id/upload` | File upload |
| GET | `/channels/:id/search` | Search messages |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run `pnpm typecheck && pnpm build` to verify
5. Commit: `git commit -m "feat: my feature"`
6. Push and open a Pull Request

## License

MIT
