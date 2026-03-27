import type { Server, Socket } from 'socket.io'
import { SOCKET_EVENTS } from '@clinikchat/shared'

const TYPING_TIMEOUT_MS = 5000

const typingTimers = new Map<string, NodeJS.Timeout>()

export function setupTypingHandlers(_io: Server, socket: Socket) {
  socket.on(SOCKET_EVENTS.TYPING_START, (data: { channelId: string }) => {
    const key = `${socket.user.id}:${data.channelId}`

    // Clear existing timer
    const existing = typingTimers.get(key)
    if (existing) clearTimeout(existing)

    // Broadcast to channel (exclude sender)
    socket.to(`channel:${data.channelId}`).emit(SOCKET_EVENTS.TYPING_START, {
      userId: socket.user.id,
      channelId: data.channelId,
    })

    // Auto-stop after timeout
    const timer = setTimeout(() => {
      typingTimers.delete(key)
      socket.to(`channel:${data.channelId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
        userId: socket.user.id,
        channelId: data.channelId,
      })
    }, TYPING_TIMEOUT_MS)

    typingTimers.set(key, timer)
  })

  socket.on(SOCKET_EVENTS.TYPING_STOP, (data: { channelId: string }) => {
    const key = `${socket.user.id}:${data.channelId}`

    const existing = typingTimers.get(key)
    if (existing) {
      clearTimeout(existing)
      typingTimers.delete(key)
    }

    socket.to(`channel:${data.channelId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
      userId: socket.user.id,
      channelId: data.channelId,
    })
  })

  socket.on('disconnect', () => {
    // Clean up all typing timers for this socket
    for (const [key, timer] of typingTimers.entries()) {
      if (key.startsWith(`${socket.user.id}:`)) {
        clearTimeout(timer)
        typingTimers.delete(key)
      }
    }
  })
}
