import { Router } from "express";
import type { Server as IOServer } from "socket.io";
import {
  createChannelSchema,
  createDmSchema,
  ERROR_CODES,
  updateChannelSchema,
} from "@clinikchat/shared";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireChannelMember, requireOrgAdmin, requireOrgMember } from "../lib/access.js";
import { toUserDto } from "../lib/mappers.js";
import { slugifyName } from "../lib/slug.js";
import { createMessagesRouter } from "./messages.js";
import { requiredParam } from "../lib/params.js";

export function createChannelsRouter(io: IOServer): Router {
  const channelsRouter = Router({ mergeParams: true });
  channelsRouter.use(requireAuth);

  channelsRouter.get(
    "/",
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      try {
        await requireOrgMember(userId, orgId);
      } catch {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Not a member of this organization" },
        });
        return;
      }
      const memberships = await prisma.channelMember.findMany({
        where: { userId, channel: { organizationId: orgId } },
        include: {
          channel: {
            include: {
              messages: {
                where: { deletedAt: null },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { id: true, createdAt: true },
              },
            },
          },
        },
      });
      res.json({
        success: true,
        data: memberships.map((m) => {
          const { messages, ...channel } = m.channel;
          const last = messages[0];
          return {
            ...channel,
            lastReadAt: m.lastReadAt?.toISOString() ?? null,
            lastMessageAt: last?.createdAt.toISOString() ?? null,
            lastMessageId: last?.id ?? null,
          };
        }),
      });
    }),
  );

  channelsRouter.post(
    "/",
    validateBody(createChannelSchema),
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      try {
        await requireOrgMember(userId, orgId);
      } catch {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Not a member of this organization" },
        });
        return;
      }
      const body = req.body as {
        name: string;
        slug?: string;
        type: "public" | "private";
        description?: string;
      };
      const slug = body.slug ?? slugifyName(body.name);
      const channel = await prisma.channel.create({
        data: {
          organizationId: orgId,
          name: body.name,
          slug,
          type: body.type,
          description: body.description ?? null,
          createdById: userId,
          members: { create: { userId } },
        },
      });
      res.status(201).json({ success: true, data: channel });
    }),
  );

  channelsRouter.post(
    "/dm",
    validateBody(createDmSchema),
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const { userId: otherUserId } = req.body as { userId: string };
      if (otherUserId === userId) {
        res.status(400).json({
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: "Cannot DM yourself" },
        });
        return;
      }
      try {
        await requireOrgMember(userId, orgId);
        await requireOrgMember(otherUserId, orgId);
      } catch {
        res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: "Both users must be organization members",
          },
        });
        return;
      }
      const [a, b] = [userId, otherUserId].sort();
      const dmSlug = `dm-${a}-${b}`;
      const existing = await prisma.channel.findUnique({
        where: { organizationId_slug: { organizationId: orgId, slug: dmSlug } },
      });
      if (existing) {
        res.json({ success: true, data: existing });
        return;
      }
      const channel = await prisma.channel.create({
        data: {
          organizationId: orgId,
          name: "Direct message",
          slug: dmSlug,
          type: "dm",
          createdById: userId,
          members: {
            create: [{ userId }, { userId: otherUserId }],
          },
        },
      });
      res.status(201).json({ success: true, data: channel });
    }),
  );

  channelsRouter.get(
    "/:channelId",
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      try {
        await requireOrgMember(userId, orgId);
        const cm = await requireChannelMember(userId, channelId);
        if (cm.organizationId !== orgId) {
          res.status(404).json({
            success: false,
            error: { code: ERROR_CODES.NOT_FOUND, message: "Channel not found" },
          });
          return;
        }
      } catch {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Access denied" },
        });
        return;
      }
      const channel = await prisma.channel.findFirstOrThrow({
        where: { id: channelId, organizationId: orgId },
      });
      res.json({ success: true, data: channel });
    }),
  );

  channelsRouter.patch(
    "/:channelId",
    validateBody(updateChannelSchema),
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      try {
        await requireOrgAdmin(userId, orgId);
        await requireChannelMember(userId, channelId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.startsWith("FORBIDDEN")) {
          res.status(403).json({
            success: false,
            error: { code: ERROR_CODES.FORBIDDEN, message: "Admin access required" },
          });
          return;
        }
        throw e;
      }
      const body = req.body as { name?: string; description?: string | null };
      const channel = await prisma.channel.update({
        where: { id: channelId },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
        },
      });
      res.json({ success: true, data: channel });
    }),
  );

  channelsRouter.delete(
    "/:channelId",
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      try {
        await requireOrgAdmin(userId, orgId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "FORBIDDEN_ORG" || msg === "FORBIDDEN_ADMIN") {
          res.status(403).json({
            success: false,
            error: { code: ERROR_CODES.FORBIDDEN, message: "Admin access required" },
          });
          return;
        }
        throw e;
      }
      const ch = await prisma.channel.findFirst({
        where: { id: channelId, organizationId: orgId },
      });
      if (!ch) {
        res.status(404).json({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: "Channel not found" },
        });
        return;
      }
      await prisma.channel.delete({ where: { id: channelId } });
      res.json({ success: true, data: { deleted: true } });
    }),
  );

  channelsRouter.get(
    "/:channelId/members",
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      try {
        await requireOrgMember(userId, orgId);
        const cm = await requireChannelMember(userId, channelId);
        if (cm.organizationId !== orgId) {
          res.status(404).json({
            success: false,
            error: { code: ERROR_CODES.NOT_FOUND, message: "Channel not found" },
          });
          return;
        }
      } catch {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Access denied" },
        });
        return;
      }
      const members = await prisma.channelMember.findMany({
        where: { channelId },
        include: { user: true },
      });
      res.json({
        success: true,
        data: members.map((m) => ({
          id: m.id,
          channelId: m.channelId,
          userId: m.userId,
          lastReadAt: m.lastReadAt?.toISOString() ?? null,
          mutedUntil: m.mutedUntil?.toISOString() ?? null,
          joinedAt: m.joinedAt.toISOString(),
          user: m.user ? toUserDto(m.user) : undefined,
        })),
      });
    }),
  );

  channelsRouter.post(
    "/:channelId/members",
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      const targetUserId = (req.body as { userId?: string }).userId;
      if (!targetUserId || typeof targetUserId !== "string") {
        res.status(400).json({
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: "userId is required" },
        });
        return;
      }
      try {
        await requireOrgMember(userId, orgId);
        await requireChannelMember(userId, channelId);
        await requireOrgMember(targetUserId, orgId);
      } catch {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Access denied" },
        });
        return;
      }
      const channel = await prisma.channel.findFirstOrThrow({
        where: { id: channelId, organizationId: orgId },
      });
      if (channel.type === "dm") {
        res.status(400).json({
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: "Cannot add members to a DM" },
        });
        return;
      }
      const existing = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId, userId: targetUserId } },
      });
      if (existing) {
        res.status(409).json({
          success: false,
          error: { code: ERROR_CODES.CONFLICT, message: "User is already in the channel" },
        });
        return;
      }
      const member = await prisma.channelMember.create({
        data: { channelId, userId: targetUserId },
        include: { user: true },
      });
      res.status(201).json({
        success: true,
        data: {
          id: member.id,
          channelId: member.channelId,
          userId: member.userId,
          lastReadAt: member.lastReadAt?.toISOString() ?? null,
          mutedUntil: member.mutedUntil?.toISOString() ?? null,
          joinedAt: member.joinedAt.toISOString(),
          user: member.user ? toUserDto(member.user) : undefined,
        },
      });
    }),
  );

  channelsRouter.delete(
    "/:channelId/members/:memberUserId",
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      const memberUserId = requiredParam(req, "memberUserId");
      try {
        await requireOrgAdmin(userId, orgId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "FORBIDDEN_ORG" || msg === "FORBIDDEN_ADMIN") {
          res.status(403).json({
            success: false,
            error: { code: ERROR_CODES.FORBIDDEN, message: "Admin access required" },
          });
          return;
        }
        throw e;
      }
      const channel = await prisma.channel.findFirst({
        where: { id: channelId, organizationId: orgId },
      });
      if (!channel) {
        res.status(404).json({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: "Channel not found" },
        });
        return;
      }
      await prisma.channelMember.deleteMany({
        where: { channelId, userId: memberUserId },
      });
      res.json({ success: true, data: { removed: true } });
    }),
  );

  channelsRouter.use("/:channelId/messages", createMessagesRouter(io));

  return channelsRouter;
}
