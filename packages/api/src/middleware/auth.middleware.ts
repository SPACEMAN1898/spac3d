import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'
import { AppError } from '../lib/errors'
import { ERROR_CODES } from '@clinikchat/shared'

export interface AuthenticatedRequest extends Request {
  userId: string
  userEmail: string
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, ERROR_CODES.AUTH_UNAUTHORIZED, 'No authorization token provided'))
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = verifyAccessToken(token)
    ;(req as AuthenticatedRequest).userId = payload.sub
    ;(req as AuthenticatedRequest).userEmail = payload.email
    next()
  } catch {
    next(new AppError(401, ERROR_CODES.AUTH_TOKEN_INVALID, 'Invalid or expired token'))
  }
}
