import { ERROR_CODES } from '@clinikchat/shared'
import type { NextFunction, Request, Response } from 'express'

import { AppError } from '../lib/errors'
import { verifyToken } from '../lib/jwt'

function extractBearerToken(request: Request): string | null {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return null
  }
  return header.slice('Bearer '.length).trim()
}

export function authMiddleware(request: Request, _response: Response, next: NextFunction): void {
  const token = extractBearerToken(request)
  if (!token) {
    next(new AppError('Authentication is required', 401, ERROR_CODES.AUTH_REQUIRED))
    return
  }

  try {
    request.user = verifyToken(token, 'access')
    next()
  } catch {
    next(new AppError('Token is invalid', 401, ERROR_CODES.AUTH_TOKEN_INVALID))
  }
}
