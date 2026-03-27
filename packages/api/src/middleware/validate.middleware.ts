import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'

export type ValidationTarget = 'body' | 'params' | 'query'

export function validateMiddleware<T>(schema: ZodSchema<T>, target: ValidationTarget = 'body') {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const source = request[target]
    const result = schema.safeParse(source)
    if (!result.success) {
      next(result.error)
      return
    }

    request[target] = result.data as Request[typeof target]
    next()
  }
}
