import type { Server, Socket } from 'socket.io';
import { SocketEvents } from '@clinikchat/shared';
import * as messageService from '../services/message.service.js';

export function registerMessageHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.userId as string;

  socket.on(SocketEvents.MESSAGE_NEW, async (data: { channelId: string; content: string; parentId?: string }) => {
    try {
      const message = await messageService.sendMessage(data.channelId, userId, {
        content: data.content,
        parentId: data.parentId,
      });
      io.to(`channel:${data.channelId}`).emit(SocketEvents.MESSAGE_NEW, message);
    } catch (err) {
      socket.emit(SocketEvents.ERROR, { message: (err as Error).message });
    }
  });

  socket.on(SocketEvents.MESSAGE_EDIT, async (data: { messageId: string; content: string }) => {
    try {
      const message = await messageService.editMessage(data.messageId, userId, {
        content: data.content,
      });
      io.to(`channel:${message.channelId}`).emit(SocketEvents.MESSAGE_EDIT, message);
    } catch (err) {
      socket.emit(SocketEvents.ERROR, { message: (err as Error).message });
    }
  });

  socket.on(SocketEvents.MESSAGE_DELETE, async (data: { messageId: string }) => {
    try {
      const result = await messageService.deleteMessage(data.messageId, userId);
      io.to(`channel:${result.channelId}`).emit(SocketEvents.MESSAGE_DELETE, {
        messageId: data.messageId,
        channelId: result.channelId,
      });
    } catch (err) {
      socket.emit(SocketEvents.ERROR, { message: (err as Error).message });
    }
  });
}
