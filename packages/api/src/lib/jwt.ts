import jwt from 'jsonwebtoken'
import type { TokenPayload } from '@clinikchat/shared'

const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'] ?? 'dev-access-secret'
const REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] ?? 'dev-refresh-secret'
const ACCESS_EXPIRES = process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m'
const REFRESH_EXPIRES = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d'

export function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions)
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string }
}

export function getRefreshTokenExpiry(): Date {
  const days = 7
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}
