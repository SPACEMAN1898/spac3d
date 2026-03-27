import { Router } from "express";
import {
  editMessageSchema,
  ERROR_CODES,
  markReadSchema,
  messageCursorSchema,
  sendMessageSchema,
  SOCKET_EVENTS,
} from "@clinikchat/shared";
import type { Server as IOServer } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireChannelMember, requireOrgMember } from "../lib/access.js";
import { toUserDto } from "../lib/mappers.js";
import { requiredParam } from "../lib/params.js";
import type { User as PrismaUser } from "@prisma/client";

function messageSelect() {
  return {
    id: true,
    channelId: true,
    authorId: true,
    parentId: true,
    content: true,
    editedAt: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    author: true,
    attachments: true,
  } as const;
}

function toMessageDto(m: {
  id: string;
  channelId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
    author: PrismaUser;
  attachments: { id: string; messageId: string; fileName: string; mimeType: string; sizeBytes: number; storageKey: string; createdAt: Date }[];
}) {
  return {
    id: m.id,
    channelId: m.channelId,
    authorId: m.authorId,
    parentId: m.parentId,
    content: m.content,
    editedAt: m.editedAt?.toISOString() ?? null,
    deletedAt: m.deletedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    author: toUserDto(m.author),
    attachments: m.attachments.map((a) => ({
      id: a.id,
      messageId: a.messageId,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      storageKey: a.storageKey,
      url: null,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export function createMessagesRouter(io: IOServer): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth);

  router.get(
    "/",
    validateQuery(messageCursorSchema),
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      const { cursor, limit } = req.validatedQuery as {
        cursor?: string;
        limit: number;
      };
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

      let beforeDate: Date | undefined;
      if (cursor) {
        const cur = await prisma.message.findFirst({
          where: { id: cursor, channelId, deletedAt: null },
        });
        if (!cur) {
          res.status(400).json({
            success: false,
            error: { code: ERROR_CODES.VALIDATION_ERROR, message: "Invalid cursor" },
          });
          return;
        }
        beforeDate = cur.createdAt;
      }

      const rows = await prisma.message.findMany({
        where: {
          channelId,
          deletedAt: null,
          ...(beforeDate && { createdAt: { lt: beforeDate } }),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: messageSelect(),
      });

      const chronological = [...rows].reverse();
      const nextCursor =
        chronological.length > 0 && rows.length === limit ? chronological[0]?.id ?? null : null;

      res.json({
        success: true,
        data: {
          messages: chronological.map(toMessageDto),
          nextCursor,
        },
      });
    }),
  );

  router.post(
    "/",
    validateBody(sendMessageSchema),
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      const body = req.body as { content: string; parentId?: string };
      try {
        await requireOrgMember(userId, orgId);
        await requireChannelMember(userId, channelId);
      } catch {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Access denied" },
        });
        return;
      }
      const msg = await prisma.message.create({
        data: {
          channelId,
          authorId: userId,
          content: body.content,
          parentId: body.parentId ?? null,
        },
        select: messageSelect(),
      });
      const dto = toMessageDto(msg);
      io.to(`channel:${channelId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, dto);
      res.status(201).json({ success: true, data: dto });
    }),
  );

  router.patch(
    "/:messageId",
    validateBody(editMessageSchema),
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      const messageId = requiredParam(req, "messageId");
      try {
        await requireOrgMember(userId, orgId);
        await requireChannelMember(userId, channelId);
      } catch {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Access denied" },
        });
        return;
      }
      const existing = await prisma.message.findFirst({
        where: { id: messageId, channelId, deletedAt: null },
      });
      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: "Message not found" },
        });
        return;
      }
      if (existing.authorId !== userId) {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Cannot edit this message" },
        });
        return;
      }
      const body = req.body as { content: string };
      const msg = await prisma.message.update({
        where: { id: messageId },
        data: { content: body.content, editedAt: new Date() },
        select: messageSelect(),
      });
      const dto = toMessageDto(msg);
      io.to(`channel:${channelId}`).emit(SOCKET_EVENTS.MESSAGE_UPDATED, dto);
      res.json({ success: true, data: dto });
    }),
  );

  router.delete(
    "/:messageId",
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      const messageId = requiredParam(req, "messageId");
      try {
        await requireOrgMember(userId, orgId);
        await requireChannelMember(userId, channelId);
      } catch {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Access denied" },
        });
        return;
      }
      const existing = await prisma.message.findFirst({
        where: { id: messageId, channelId, deletedAt: null },
      });
      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: "Message not found" },
        });
        return;
      }
      if (existing.authorId !== userId) {
        const { role } = await requireOrgMember(userId, orgId);
        if (role !== "owner" && role !== "admin") {
          res.status(403).json({
            success: false,
            error: { code: ERROR_CODES.FORBIDDEN, message: "Cannot delete this message" },
          });
          return;
        }
      }
      await prisma.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date(), content: "" },
      });
      io.to(`channel:${channelId}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, { id: messageId, channelId });
      res.json({ success: true, data: { id: messageId, deleted: true } });
    }),
  );

  router.post(
    "/read",
    validateBody(markReadSchema),
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const orgId = requiredParam(req, "orgId");
      const channelId = requiredParam(req, "channelId");
      const { lastMessageId } = req.body as { lastMessageId: string };
      try {
        await requireOrgMember(userId, orgId);
        await requireChannelMember(userId, channelId);
      } catch {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Access denied" },
        });
        return;
      }
      const msg = await prisma.message.findFirst({
        where: { id: lastMessageId, channelId, deletedAt: null },
      });
      if (!msg) {
        res.status(404).json({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: "Message not found" },
        });
        return;
      }
      const member = await prisma.channelMember.findUniqueOrThrow({
        where: { channelId_userId: { channelId, userId } },
      });
      const nextRead =
        !member.lastReadAt || msg.createdAt > member.lastReadAt ? msg.createdAt : member.lastReadAt;
      await prisma.channelMember.update({
        where: { channelId_userId: { channelId, userId } },
        data: { lastReadAt: nextRead },
      });
      io.to(`channel:${channelId}`).emit(SOCKET_EVENTS.READ_RECEIPT, {
        channelId,
        userId,
        lastReadAt: nextRead.toISOString(),
      });
      res.json({ success: true, data: { lastReadAt: nextRead.toISOString() } });
    }),
  );

  return router;
}
