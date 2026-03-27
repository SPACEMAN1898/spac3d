import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "./env.js";

export interface AccessPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    subject: payload.sub,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & AccessPayload;
  return { sub: decoded.sub ?? "", email: decoded.email ?? "" };
}

export function signRefreshToken(payload: { sub: string }): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    subject: payload.sub,
    jwtid: crypto.randomUUID(),
  };
  return jwt.sign({ typ: "refresh" }, env.JWT_REFRESH_SECRET, options);
}

export function verifyRefreshToken(token: string): { sub: string; jti: string } {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  if (decoded.typ !== "refresh") throw new Error("Invalid refresh token");
  const sub = decoded.sub;
  const jti = decoded.jti;
  if (!sub || !jti) throw new Error("Invalid refresh token");
  return { sub, jti };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
