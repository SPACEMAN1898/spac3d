import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'
import { AppError } from '../lib/errors'
import { ERROR_CODES } from '@clinikchat/shared'

type ValidateTarget = 'body' | 'params' | 'query'

export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      next(
        new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', details),
      )
      return
    }
    req[target] = result.data as Request[typeof target]
    next()
  }
}
