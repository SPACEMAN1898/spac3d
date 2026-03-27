import type { Server, Socket } from 'socket.io';
import { SocketEvents } from '@clinikchat/shared';
import { prisma } from '../lib/prisma.js';

export function registerPresenceHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.userId as string;

  socket.on(SocketEvents.PRESENCE_UPDATE, async (data: { status: 'ONLINE' | 'AWAY' | 'OFFLINE' }) => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { status: data.status, lastSeenAt: new Date() },
      });

      const orgs = await prisma.organizationMember.findMany({
        where: { userId },
        select: { orgId: true },
      });

      for (const org of orgs) {
        io.to(`org:${org.orgId}`).emit(SocketEvents.PRESENCE_UPDATE, {
          userId,
          status: data.status,
        });
      }
    } catch (err) {
      socket.emit(SocketEvents.ERROR, { message: (err as Error).message });
    }
  });
}
