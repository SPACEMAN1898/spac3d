import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { verifyAccessToken } from '../lib/jwt'
import { prisma } from '../lib/prisma'
import { SOCKET_EVENTS } from '@clinikchat/shared'
import { setupMessageHandlers } from './message.handler'
import { setupTypingHandlers } from './typing.handler'
import { setupPresenceHandlers } from './presence.handler'

export interface SocketUser {
  id: string
  email: string
}

declare module 'socket.io' {
  interface Socket {
    user: SocketUser
  }
}

export function initSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Auth middleware
  io.use(async (socket, next) => {
    const token =
      (socket.handshake.auth as Record<string, string | undefined>)['token'] ??
      socket.handshake.headers['authorization']?.replace('Bearer ', '')

    if (!token) {
      next(new Error('No authentication token'))
      return
    }

    try {
      const payload = verifyAccessToken(token)
      socket.user = { id: payload.sub, email: payload.email }
      next()
    } catch {
      next(new Error('Invalid authentication token'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.user.id
    console.log(`Socket connected: ${socket.id} (user: ${userId})`)

    // Join rooms for all user's channels
    try {
      const memberships = await prisma.channelMember.findMany({
        where: { userId },
        select: { channelId: true },
      })
      for (const { channelId } of memberships) {
        await socket.join(`channel:${channelId}`)
      }

      // Update user status to ONLINE
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'ONLINE' },
      })

      // Broadcast presence to all orgs the user belongs to
      const orgMemberships = await prisma.organizationMember.findMany({
        where: { userId },
        select: { orgId: true },
      })
      for (const { orgId } of orgMemberships) {
        socket.to(`org:${orgId}`).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
          userId,
          status: 'ONLINE',
        })
        await socket.join(`org:${orgId}`)
      }
    } catch (err) {
      console.error('Error during socket connection setup:', err)
    }

    setupMessageHandlers(io, socket)
    setupTypingHandlers(io, socket)
    setupPresenceHandlers(io, socket)

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${userId})`)
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { status: 'OFFLINE', lastSeenAt: new Date() },
        })

        const orgMemberships = await prisma.organizationMember.findMany({
          where: { userId },
          select: { orgId: true },
        })
        for (const { orgId } of orgMemberships) {
          io.to(`org:${orgId}`).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
            userId,
            status: 'OFFLINE',
            lastSeenAt: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error('Error during socket disconnect cleanup:', err)
      }
    })
  })

  return io
}
