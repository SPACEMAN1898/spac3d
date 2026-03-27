import type { Server, Socket } from 'socket.io'
import { SOCKET_EVENTS } from '@clinikchat/shared'
import { prisma } from '../lib/prisma'

const HEARTBEAT_INTERVAL_MS = 30000

export function setupPresenceHandlers(io: Server, socket: Socket) {
  // Handle manual presence updates
  socket.on(
    SOCKET_EVENTS.PRESENCE_UPDATE,
    async (data: { status: 'ONLINE' | 'AWAY' | 'OFFLINE' }) => {
      try {
        const validStatuses = ['ONLINE', 'AWAY', 'OFFLINE']
        if (!validStatuses.includes(data.status)) return

        await prisma.user.update({
          where: { id: socket.user.id },
          data: { status: data.status },
        })

        const orgMemberships = await prisma.organizationMember.findMany({
          where: { userId: socket.user.id },
          select: { orgId: true },
        })

        for (const { orgId } of orgMemberships) {
          io.to(`org:${orgId}`).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
            userId: socket.user.id,
            status: data.status,
          })
        }
      } catch (err) {
        console.error('Error handling PRESENCE_UPDATE:', err)
      }
    },
  )

  // Heartbeat to detect stale connections
  const heartbeatInterval = setInterval(async () => {
    try {
      await prisma.user.update({
        where: { id: socket.user.id },
        data: { lastSeenAt: new Date() },
      })
    } catch {
      // User might have been deleted
    }
  }, HEARTBEAT_INTERVAL_MS)

  socket.on('disconnect', () => {
    clearInterval(heartbeatInterval)
  })
}
