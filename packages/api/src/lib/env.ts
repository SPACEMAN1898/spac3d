export const env = {
  apiPort: Number(process.env.API_PORT ?? 3001),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/clinikchat_dev?schema=public',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? '7d'
}
