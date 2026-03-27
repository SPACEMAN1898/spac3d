import type { TokenPayload } from '@clinikchat/shared'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'

import { env } from './env.js'

export const generateAccessToken = (payload: TokenPayload) => {
  const options = {
    subject: payload.sub,
    expiresIn: env.jwtAccessTtl as Exclude<SignOptions['expiresIn'], undefined>
  } satisfies SignOptions
  return jwt.sign(payload, env.jwtAccessSecret, options)
}

export const generateRefreshToken = (payload: TokenPayload) => {
  const options = {
    subject: payload.sub,
    expiresIn: env.jwtRefreshTtl as Exclude<SignOptions['expiresIn'], undefined>
  } satisfies SignOptions
  return jwt.sign(payload, env.jwtRefreshSecret, options)
}

export const verifyAccessToken = (token: string) => jwt.verify(token, env.jwtAccessSecret) as TokenPayload
export const verifyRefreshToken = (token: string) => jwt.verify(token, env.jwtRefreshSecret) as TokenPayload
