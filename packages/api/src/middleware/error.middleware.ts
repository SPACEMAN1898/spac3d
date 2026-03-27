import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/errors'
import { ERROR_CODES } from '@clinikchat/shared'

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    })
    return
  }

  if (err instanceof Error) {
    console.error('Unhandled error:', err)
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'An internal server error occurred',
      },
    })
    return
  }

  console.error('Unknown error:', err)
  res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'An internal server error occurred',
    },
  })
}
