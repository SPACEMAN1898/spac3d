import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../lib/errors.js';
import { ErrorCodes } from '@clinikchat/shared';

type ValidationTarget = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details);
    }

    req[target] = result.data;
    next();
  };
}
