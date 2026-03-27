import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export type Env = z.infer<typeof envSchema> & { COOKIE_SECURE: boolean };

export const env: Env = envSchema.parse({
  ...process.env,
  COOKIE_SECURE: process.env.COOKIE_SECURE,
}) as Env;
