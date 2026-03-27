import { SOCKET_EVENTS } from '@clinikchat/shared'
import type { Server, Socket } from 'socket.io'

import { sendMessage } from '../services/message.service.js'

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  socket.on(SOCKET_EVENTS.MESSAGE_NEW, async (payload: { channelId: string; content: string }) => {
    try {
      const user = socket.data.user
      if (!user) return
      const message = await sendMessage(user, payload.channelId, { content: payload.content, type: 'text' })
      io.to(`channel:${payload.channelId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, message)
    } catch (error) {
      socket.emit('error', { message: error instanceof Error ? error.message : 'Unable to send message' })
    }
  })
}
