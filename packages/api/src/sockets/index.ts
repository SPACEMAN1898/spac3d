import type { Server as HttpServer } from 'http'

import { SOCKET_EVENTS } from '@clinikchat/shared'
import { Server } from 'socket.io'

import { env } from '../lib/env.js'
import { setSocketServer } from '../lib/io.js'
import { verifyAccessToken } from '../lib/jwt.js'
import { prisma } from '../lib/prisma.js'

import { registerMessageHandlers } from './message.handler.js'
import { registerPresenceHandlers } from './presence.handler.js'
import { registerTypingHandlers } from './typing.handler.js'

export const initializeSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: env.webOrigin,
      credentials: true
    }
  })

  io.use((socket, next) => {
    try {
      const token = typeof socket.handshake.auth.token === 'string' ? socket.handshake.auth.token : undefined
      if (!token) {
        return next(new Error('Missing auth token'))
      }

      socket.data.user = verifyAccessToken(token)
      return next()
    } catch (error) {
      return next(error instanceof Error ? error : new Error('Unauthorized'))
    }
  })

  io.on('connection', async (socket) => {
    const user = socket.data.user
    if (!user) {
      socket.disconnect(true)
      return
    }

    const memberships = await prisma.organizationMember.findMany({ where: { userId: user.sub } })
    const channelMemberships = await prisma.channelMember.findMany({ where: { userId: user.sub } })

    for (const membership of memberships) {
      await socket.join(`org:${membership.orgId}`)
    }

    for (const membership of channelMemberships) {
      await socket.join(`channel:${membership.channelId}`)
    }

    registerMessageHandlers(io, socket)
    registerTypingHandlers(socket)
    registerPresenceHandlers(socket)

    socket.on(SOCKET_EVENTS.MESSAGE_EDIT, () => undefined)
    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, () => undefined)
  })

  setSocketServer(io)

  return io
}
