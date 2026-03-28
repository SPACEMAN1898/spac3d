FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# --- Install dependencies ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @clinikchat/api --filter @clinikchat/shared

# --- Build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/api/ packages/api/

RUN pnpm --filter @clinikchat/shared run build
RUN cd packages/api && npx prisma generate
RUN pnpm --filter @clinikchat/api run build

# --- Production ---
FROM node:20-alpine AS production
RUN apk add --no-cache curl && addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=build /app/packages/api/dist ./dist
COPY --from=build /app/packages/api/prisma ./prisma
COPY --from=build /app/packages/api/package.json ./
COPY --from=build /app/packages/api/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./node_modules/@clinikchat/shared/dist
COPY --from=build /app/packages/shared/package.json ./node_modules/@clinikchat/shared/

USER app

ENV NODE_ENV=production
ENV API_PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
