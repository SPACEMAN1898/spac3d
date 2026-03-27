import { SOCKET_EVENTS } from '@clinikchat/shared'
import { UserStatus } from '@prisma/client'
import type { Server, Socket } from 'socket.io'
import { z } from 'zod'

import { prisma } from '../lib/prisma'

const presenceSchema = z.object({
  status: z.enum(['online', 'away', 'offline'])
})

function toStatus(status: 'online' | 'away' | 'offline') {
  if (status === 'online') return UserStatus.ONLINE
  if (status === 'away') return UserStatus.AWAY
  return UserStatus.OFFLINE
}

export function registerPresenceHandlers(io: Server, socket: Socket, userId: string): void {
  socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, async (payload) => {
    const parsed = presenceSchema.safeParse(payload)
    if (!parsed.success) return

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: toStatus(parsed.data.status),
        lastSeenAt: new Date()
      }
    })

    io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
      userId,
      status: parsed.data.status
    })
  })
}
