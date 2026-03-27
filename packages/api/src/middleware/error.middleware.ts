import { ERROR_CODES } from '@clinikchat/shared'
import type { Request, Response } from 'express'
import { ZodError } from 'zod'

import { Prisma } from '../generated/prisma/client.js'
import { AppError } from '../lib/errors.js'

export const errorMiddleware = (
  error: unknown,
  _request: Request,
  response: Response
) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    })
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.flatten()
      }
    })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return response.status(409).json({
      success: false,
      error: {
        code: ERROR_CODES.CONFLICT,
        message: 'A record with this value already exists',
        details: error.meta
      }
    })
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error'

  return response.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message
    }
  })
}
