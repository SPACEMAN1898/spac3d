import { ERROR_CODES } from '@clinikchat/shared'
import type { NextFunction, Request, Response } from 'express'

import { AppError } from '../lib/errors.js'
import { verifyAccessToken } from '../lib/jwt.js'

export const authMiddleware = (request: Request, _response: Response, next: NextFunction) => {
  const authorization = request.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    return next(new AppError(401, ERROR_CODES.AUTH_UNAUTHORIZED, 'Missing access token'))
  }

  try {
    request.user = verifyAccessToken(authorization.slice(7))
    return next()
  } catch {
    return next(new AppError(401, ERROR_CODES.AUTH_UNAUTHORIZED, 'Invalid access token'))
  }
}
