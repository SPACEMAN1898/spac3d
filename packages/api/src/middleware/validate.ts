import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ERROR_CODES } from "@clinikchat/shared";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid query parameters",
          details: parsed.error.flatten(),
        },
      });
      return;
    }
    req.validatedQuery = parsed.data;
    next();
  };
}
