import { ERROR_CODES } from '@clinikchat/shared'
import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

import { AppError } from '../lib/errors'

export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    response.status(422).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.flatten()
      }
    })
    return
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    })
    return
  }

  response.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Unexpected server error'
    }
  })
}
