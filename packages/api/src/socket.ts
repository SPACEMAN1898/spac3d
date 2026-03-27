import type { Server as HTTPServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { ERROR_CODES, SOCKET_EVENTS, sendMessageSchema } from "@clinikchat/shared";
import { z } from "zod";
import type { User as PrismaUser } from "@prisma/client";
import { verifyAccessToken } from "./lib/jwt.js";
import { prisma } from "./lib/prisma.js";
import { requireChannelMember, requireOrgMember } from "./lib/access.js";
import { env } from "./lib/env.js";
import { prismaStatusFromDto, toUserDto } from "./lib/mappers.js";

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

const socketMessagePayloadSchema = sendMessageSchema.extend({
  channelId: z.string().uuid(),
});

type AckFn = (result: { success: boolean; error?: string; data?: unknown }) => void;

type SocketAuthData = { userId: string; email: string };

function authData(socket: Socket): SocketAuthData {
  return socket.data as SocketAuthData;
}

export function attachSocketIO(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const auth = socket.handshake.auth as { token?: string };
      const header = socket.handshake.headers.authorization;
      const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
      const token = auth?.token ?? bearer;
      if (!token) {
        next(new Error("Unauthorized"));
        return;
      }
      const payload = verifyAccessToken(token);
      const d = authData(socket);
      d.userId = payload.sub;
      d.email = payload.email;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = authData(socket).userId;

    socket.on(
      SOCKET_EVENTS.JOIN_CHANNEL,
      async (payload: { channelId: string }, cb?: AckFn) => {
      try {
        const { channelId } = payload ?? {};
        if (!channelId) {
          cb?.({ success: false, error: ERROR_CODES.VALIDATION_ERROR });
          return;
        }
        await requireChannelMember(userId, channelId);
        await socket.join(`channel:${channelId}`);
        cb?.({ success: true });
      } catch {
        cb?.({ success: false, error: ERROR_CODES.FORBIDDEN });
      }
      },
    );

    socket.on(SOCKET_EVENTS.LEAVE_CHANNEL, (payload: { channelId: string }) => {
      const channelId = payload?.channelId;
      if (channelId) void socket.leave(`channel:${channelId}`);
    });

    socket.on(
      SOCKET_EVENTS.JOIN_ORG,
      async (payload: { organizationId: string }, cb?: AckFn) => {
      try {
        const organizationId = payload?.organizationId;
        if (!organizationId) {
          cb?.({ success: false, error: ERROR_CODES.VALIDATION_ERROR });
          return;
        }
        await requireOrgMember(userId, organizationId);
        await socket.join(`org:${organizationId}`);
        cb?.({ success: true });
      } catch {
        cb?.({ success: false, error: ERROR_CODES.FORBIDDEN });
      }
      },
    );

    socket.on(SOCKET_EVENTS.LEAVE_ORG, (payload: { organizationId: string }) => {
      const organizationId = payload?.organizationId;
      if (organizationId) void socket.leave(`org:${organizationId}`);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload: unknown, cb?: AckFn) => {
      try {
        const parsed = socketMessagePayloadSchema.safeParse(payload);
        if (!parsed.success) {
          cb?.({ success: false, error: ERROR_CODES.VALIDATION_ERROR });
          return;
        }
        const body = parsed.data;
        const { channelId, content, parentId } = body;
        await requireChannelMember(userId, channelId);
        const msg = await prisma.message.create({
          data: {
            channelId,
            authorId: userId,
            content,
            parentId: parentId ?? null,
          },
          select: messageSelect(),
        });
        const dto = toMessageDto(msg);
        io.to(`channel:${channelId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, dto);
        cb?.({ success: true, data: dto });
      } catch {
        cb?.({ success: false, error: ERROR_CODES.FORBIDDEN });
      }
    });

    socket.on(
      SOCKET_EVENTS.TYPING_START,
      async (payload: { channelId: string; organizationId?: string }) => {
        const { channelId } = payload ?? {};
        if (!channelId) return;
        try {
          await requireChannelMember(userId, channelId);
          socket.to(`channel:${channelId}`).emit(SOCKET_EVENTS.TYPING_START, {
            channelId,
            userId,
          });
        } catch {
          /* ignore */
        }
      },
    );

    socket.on(SOCKET_EVENTS.TYPING_STOP, async (payload: { channelId: string }) => {
      const { channelId } = payload ?? {};
      if (!channelId) return;
      try {
        await requireChannelMember(userId, channelId);
        socket.to(`channel:${channelId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
          channelId,
          userId,
        });
      } catch {
        /* ignore */
      }
    });

    socket.on(
      SOCKET_EVENTS.PRESENCE_UPDATE,
      async (payload: { organizationId: string; status: "online" | "away" | "offline" }) => {
        const { organizationId, status } = payload ?? {};
        if (!organizationId || !status) return;
        try {
          await requireOrgMember(userId, organizationId);
          await prisma.user.update({
            where: { id: userId },
            data: { status: prismaStatusFromDto(status) },
          });
          io.to(`org:${organizationId}`).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
            userId,
            status,
          });
        } catch {
          /* ignore */
        }
      },
    );

  });

  return io;
}
