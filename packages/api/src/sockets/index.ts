import { SOCKET_EVENTS } from '@clinikchat/shared'
import { UserStatus } from '@prisma/client'
import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'

import { verifyToken } from '../lib/jwt'
import { prisma } from '../lib/prisma'
import { registerMessageHandlers } from './message.handler'
import { registerPresenceHandlers } from './presence.handler'
import { registerTypingHandlers } from './typing.handler'

let ioInstance: Server | null = null

export function initSocketServer(httpServer: HttpServer, corsOrigin: string): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true
    }
  })

  io.use((socket, next) => {
    const authToken =
      (socket.handshake.auth.token as string | undefined) ??
      (socket.handshake.headers.authorization as string | undefined)?.replace('Bearer ', '')

    if (!authToken) {
      next(new Error('Authentication token is required'))
      return
    }

    try {
      const payload = verifyToken(authToken, 'access')
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Invalid authentication token'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.data.user.sub as string

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ONLINE,
        lastSeenAt: new Date()
      }
    })

    const memberships = await prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true }
    })

    for (const membership of memberships) {
      socket.join(`channel:${membership.channelId}`)
    }

    registerMessageHandlers(io, socket, userId)
    registerTypingHandlers(io, socket, userId)
    registerPresenceHandlers(io, socket, userId)

    socket.on('disconnect', async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.OFFLINE,
          lastSeenAt: new Date()
        }
      })

      io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        userId,
        status: 'offline'
      })
    })
  })

  ioInstance = io
  return io
}

export function getSocketServer(): Server | null {
  return ioInstance
}
