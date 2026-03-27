import type { Request } from "express";

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export function requiredParam(req: Request, key: string): string {
  const v = req.params[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new BadRequestError(`Missing route parameter: ${key}`);
  }
  return v;
}
