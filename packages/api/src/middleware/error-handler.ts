import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "@clinikchat/shared";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { BadRequestError } from "../lib/params.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof BadRequestError) {
    res.status(400).json({
      success: false,
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: err.message },
    });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Validation failed",
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: "Resource already exists" },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: "Resource not found" },
      });
      return;
    }
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({
    success: false,
    error: { code: ERROR_CODES.INTERNAL_ERROR, message },
  });
}
