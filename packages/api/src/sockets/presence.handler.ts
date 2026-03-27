import { SOCKET_EVENTS } from '@clinikchat/shared'
import type { Socket } from 'socket.io'

import { prisma } from '../lib/prisma.js'

export const registerPresenceHandlers = (socket: Socket) => {
  const user = socket.data.user
  if (!user) return

  const broadcast = async (status: 'ONLINE' | 'AWAY' | 'OFFLINE') => {
    await prisma.user.update({ where: { id: user.sub }, data: { status, lastSeenAt: new Date() } })

    const memberships = await prisma.organizationMember.findMany({ where: { userId: user.sub } })
    for (const membership of memberships) {
      socket.to(`org:${membership.orgId}`).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        userId: user.sub,
        status: status.toLowerCase(),
        lastSeenAt: new Date().toISOString()
      })
    }
  }

  void broadcast('ONLINE')

  const heartbeat = setInterval(() => {
    void prisma.user.update({ where: { id: user.sub }, data: { lastSeenAt: new Date() } })
  }, 30000)

  socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (payload: { status: 'online' | 'away' | 'offline' }) => {
    void broadcast(payload.status.toUpperCase() as 'ONLINE' | 'AWAY' | 'OFFLINE')
  })

  socket.on('disconnect', () => {
    clearInterval(heartbeat)
    void broadcast('OFFLINE')
  })
}
