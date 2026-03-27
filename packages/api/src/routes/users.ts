import { Router } from "express";
import { updateUserSchema } from "@clinikchat/shared";
import { prisma } from "../lib/prisma.js";
import { toUserDto, prismaStatusFromDto } from "../lib/mappers.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";

export const usersRouter = Router();

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    res.json({ success: true, data: toUserDto(user) });
  }),
);

usersRouter.patch(
  "/me",
  requireAuth,
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      displayName?: string;
      avatarUrl?: string | null;
      status?: "online" | "away" | "offline";
    };
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(body.displayName !== undefined && { displayName: body.displayName }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
        ...(body.status !== undefined && { status: prismaStatusFromDto(body.status) }),
      },
    });
    res.json({ success: true, data: toUserDto(user) });
  }),
);
