import type { NextFunction, Request, Response } from 'express'
import type { ZodObject, ZodTypeAny } from 'zod'

export const validate = <T extends ZodTypeAny>(schema: T, target: 'body' | 'query' | 'params' = 'body') => {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request[target])

    if (!result.success) {
      return next(result.error)
    }

    request[target] = result.data as Request[typeof target]
    return next()
  }
}

export const validateObject = (schema: ZodObject, target: 'body' | 'query' | 'params' = 'body') => {
  return validate(schema, target)
}
