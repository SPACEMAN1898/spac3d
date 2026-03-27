import jwt, { type SignOptions } from 'jsonwebtoken'

import type { TokenPayload } from '@clinikchat/shared'

const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret'
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret'

const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m'
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpiresIn } as SignOptions)
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn } as SignOptions)
}

export function verifyToken(token: string, kind: 'access' | 'refresh' = 'access'): TokenPayload {
  const secret = kind === 'access' ? accessSecret : refreshSecret
  return jwt.verify(token, secret) as TokenPayload
}
