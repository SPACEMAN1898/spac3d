import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "@clinikchat/shared";
import { verifyAccessToken } from "../lib/jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: ERROR_CODES.UNAUTHORIZED, message: "Missing access token" },
    });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: ERROR_CODES.UNAUTHORIZED, message: "Invalid or expired token" },
    });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email };
    } catch {
      /* ignore */
    }
  }
  next();
}
