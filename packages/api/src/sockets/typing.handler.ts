import type { Server, Socket } from 'socket.io';
import { SocketEvents } from '@clinikchat/shared';

const typingTimers = new Map<string, NodeJS.Timeout>();

export function registerTypingHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.userId as string;

  socket.on(SocketEvents.TYPING_START, (data: { channelId: string }) => {
    const key = `${userId}:${data.channelId}`;

    const existingTimer = typingTimers.get(key);
    if (existingTimer) clearTimeout(existingTimer);

    socket.to(`channel:${data.channelId}`).emit(SocketEvents.TYPING_START, {
      userId,
      channelId: data.channelId,
    });

    const timer = setTimeout(() => {
      socket.to(`channel:${data.channelId}`).emit(SocketEvents.TYPING_STOP, {
        userId,
        channelId: data.channelId,
      });
      typingTimers.delete(key);
    }, 5000);

    typingTimers.set(key, timer);
  });

  socket.on(SocketEvents.TYPING_STOP, (data: { channelId: string }) => {
    const key = `${userId}:${data.channelId}`;

    const existingTimer = typingTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      typingTimers.delete(key);
    }

    socket.to(`channel:${data.channelId}`).emit(SocketEvents.TYPING_STOP, {
      userId,
      channelId: data.channelId,
    });
  });

  socket.on('disconnect', () => {
    for (const [key, timer] of typingTimers) {
      if (key.startsWith(`${userId}:`)) {
        clearTimeout(timer);
        typingTimers.delete(key);
      }
    }
  });
}
