import { SOCKET_EVENTS } from '@clinikchat/shared'
import type { Server, Socket } from 'socket.io'
import { z } from 'zod'

import { deleteMessage, editMessage, sendMessage } from '../services/message.service'

const socketSendSchema = z.object({
  channelId: z.uuid(),
  content: z.string().min(1).max(4000),
  type: z.enum(['text', 'system', 'file']).default('text')
})

const socketEditSchema = z.object({
  messageId: z.uuid(),
  content: z.string().min(1).max(4000)
})

const socketDeleteSchema = z.object({
  messageId: z.uuid()
})

export function registerMessageHandlers(io: Server, socket: Socket, userId: string): void {
  socket.on(SOCKET_EVENTS.MESSAGE_NEW, async (payload) => {
    const parsed = socketSendSchema.safeParse(payload)
    if (!parsed.success) return

    try {
      const message = await sendMessage(userId, parsed.data.channelId, parsed.data)
      io.to(`channel:${parsed.data.channelId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, message)
    } catch {
      socket.emit('error', { message: 'Unable to send message' })
    }
  })

  socket.on(SOCKET_EVENTS.MESSAGE_EDIT, async (payload) => {
    const parsed = socketEditSchema.safeParse(payload)
    if (!parsed.success) return

    try {
      const message = await editMessage(userId, parsed.data.messageId, { content: parsed.data.content })
      io.to(`channel:${message.channelId}`).emit(SOCKET_EVENTS.MESSAGE_EDIT, message)
    } catch {
      socket.emit('error', { message: 'Unable to edit message' })
    }
  })

  socket.on(SOCKET_EVENTS.MESSAGE_DELETE, async (payload) => {
    const parsed = socketDeleteSchema.safeParse(payload)
    if (!parsed.success) return

    try {
      await deleteMessage(userId, parsed.data.messageId)
      io.emit(SOCKET_EVENTS.MESSAGE_DELETE, { messageId: parsed.data.messageId })
    } catch {
      socket.emit('error', { message: 'Unable to delete message' })
    }
  })
}
