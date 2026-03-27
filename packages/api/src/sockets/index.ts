import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { registerMessageHandlers } from './message.handler.js';
import { registerTypingHandlers } from './typing.handler.js';
import { registerPresenceHandlers } from './presence.handler.js';
import { SocketEvents } from '@clinikchat/shared';

export function initSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
    pingInterval: 30000,
    pingTimeout: 10000,
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string;
    console.log(`Socket connected: ${userId}`);

    try {
      const memberships = await prisma.channelMember.findMany({
        where: { userId },
        select: { channelId: true },
      });

      for (const m of memberships) {
        socket.join(`channel:${m.channelId}`);
      }

      await prisma.user.update({
        where: { id: userId },
        data: { status: 'ONLINE', lastSeenAt: new Date() },
      });

      const orgs = await prisma.organizationMember.findMany({
        where: { userId },
        select: { orgId: true },
      });

      for (const org of orgs) {
        socket.to(`org:${org.orgId}`).emit(SocketEvents.PRESENCE_UPDATE, {
          userId,
          status: 'ONLINE',
        });
        socket.join(`org:${org.orgId}`);
      }
    } catch (err) {
      console.error('Error on socket connection:', err);
    }

    registerMessageHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerPresenceHandlers(io, socket);

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${userId}`);
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { status: 'OFFLINE', lastSeenAt: new Date() },
        });

        const orgs = await prisma.organizationMember.findMany({
          where: { userId },
          select: { orgId: true },
        });

        for (const org of orgs) {
          io.to(`org:${org.orgId}`).emit(SocketEvents.PRESENCE_UPDATE, {
            userId,
            status: 'OFFLINE',
          });
        }
      } catch (err) {
        console.error('Error on socket disconnect:', err);
      }
    });
  });

  return io;
}
