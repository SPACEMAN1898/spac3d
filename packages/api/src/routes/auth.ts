import { Router } from "express";
import {
  ERROR_CODES,
  loginSchema,
  refreshSchema,
  registerSchema,
} from "@clinikchat/shared";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { toUserDto } from "../lib/mappers.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { env } from "../lib/env.js";
import { asyncHandler } from "../lib/async-handler.js";

const REFRESH_COOKIE = "refreshToken";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, displayName } = req.body as {
      email: string;
      password: string;
      displayName: string;
    };
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: "Email already registered" },
      });
      return;
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName, status: "online" },
    });
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });
    res.status(201).json({
      success: true,
      data: {
        user: toUserDto(user),
        accessToken,
        refreshToken,
      },
    });
  }),
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: "Invalid email or password" },
      });
      return;
    }
    const refreshed = await prisma.user.update({
      where: { id: user.id },
      data: { status: "online" },
    });
    const accessToken = signAccessToken({ sub: refreshed.id, email: refreshed.email });
    const refreshToken = signRefreshToken({ sub: user.id });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });
    res.json({
      success: true,
      data: {
        user: toUserDto(refreshed),
        accessToken,
        refreshToken,
      },
    });
  }),
);

authRouter.post(
  "/refresh",
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const bodyToken = (req.body as { refreshToken?: string }).refreshToken;
    const cookieToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const refreshToken = bodyToken || cookieToken;
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: "Missing refresh token" },
      });
      return;
    }
    const { sub } = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findFirst({
      where: { userId: sub, tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!stored) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: "Invalid refresh token" },
      });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: "User not found" },
      });
      return;
    }
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const newRefresh = signRefreshToken({ sub: user.id });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(newRefresh),
        expiresAt,
      },
    });
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    res.cookie(REFRESH_COOKIE, newRefresh, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });
    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefresh,
        user: toUserDto(user),
      },
    });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    await prisma.refreshToken.deleteMany({ where: { userId } });
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    await prisma.user.update({ where: { id: userId }, data: { status: "offline" } });
    res.json({ success: true, data: { ok: true } });
  }),
);
