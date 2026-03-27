import { SOCKET_EVENTS } from '@clinikchat/shared'
import type { Socket } from 'socket.io'

const typingState = new Map<string, NodeJS.Timeout>()

export const registerTypingHandlers = (socket: Socket) => {
  socket.on(SOCKET_EVENTS.TYPING_START, (payload: { channelId: string }) => {
    const user = socket.data.user
    if (!user) return

    const key = `${socket.id}:${payload.channelId}`
    const current = typingState.get(key)
    if (current) clearTimeout(current)

    socket.to(`channel:${payload.channelId}`).emit(SOCKET_EVENTS.TYPING_START, {
      channelId: payload.channelId,
      userId: user.sub,
      displayName: user.displayName
    })

    typingState.set(
      key,
      setTimeout(() => {
        socket.to(`channel:${payload.channelId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
          channelId: payload.channelId,
          userId: user.sub,
          displayName: user.displayName
        })
        typingState.delete(key)
      }, 5000)
    )
  })

  socket.on(SOCKET_EVENTS.TYPING_STOP, (payload: { channelId: string }) => {
    const user = socket.data.user
    if (!user) return

    socket.to(`channel:${payload.channelId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
      channelId: payload.channelId,
      userId: user.sub,
      displayName: user.displayName
    })
  })
}
