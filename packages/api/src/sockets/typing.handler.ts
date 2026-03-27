import { SOCKET_EVENTS } from '@clinikchat/shared'
import type { Server, Socket } from 'socket.io'
import { z } from 'zod'

const typingPayloadSchema = z.object({
  channelId: z.uuid()
})

export function registerTypingHandlers(io: Server, socket: Socket, userId: string): void {
  socket.on(SOCKET_EVENTS.TYPING_START, (payload) => {
    const parsed = typingPayloadSchema.safeParse(payload)
    if (!parsed.success) return

    socket.to(`channel:${parsed.data.channelId}`).emit(SOCKET_EVENTS.TYPING_START, {
      channelId: parsed.data.channelId,
      userId
    })

    setTimeout(() => {
      io.to(`channel:${parsed.data.channelId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
        channelId: parsed.data.channelId,
        userId
      })
    }, 5000)
  })

  socket.on(SOCKET_EVENTS.TYPING_STOP, (payload) => {
    const parsed = typingPayloadSchema.safeParse(payload)
    if (!parsed.success) return

    socket.to(`channel:${parsed.data.channelId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
      channelId: parsed.data.channelId,
      userId
    })
  })
}
