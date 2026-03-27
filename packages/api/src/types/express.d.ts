declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      // Set by validateQuery middleware
      validatedQuery?: unknown;
    }
  }
}

export {};
