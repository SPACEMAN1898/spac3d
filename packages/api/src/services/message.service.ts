import { ERROR_CODES, SOCKET_EVENTS } from '@clinikchat/shared'
import type { PaginatedResponse, TokenPayload } from '@clinikchat/shared'

import type { MessageType } from '../generated/prisma/enums.js';
import { MemberRole } from '../generated/prisma/enums.js'
import { AppError } from '../lib/errors.js'
import { getSocketServer } from '../lib/io.js'
import { prisma } from '../lib/prisma.js'

import { channelAccess } from './channel.service.js'

const messageInclude = {
  user: true,
  attachments: true
} as const

const serializeMessage = (message: {
  id: string
  channelId: string
  userId: string
  content: string
  type: MessageType
  parentId: string | null
  editedAt: Date | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    displayName: string
    avatarUrl: string | null
    status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  }
  attachments: {
    id: string
    messageId: string
    filename: string
    mimeType: string
    size: number
    storageKey: string
    createdAt: Date
  }[]
}) => ({
  id: message.id,
  channelId: message.channelId,
  userId: message.userId,
  content: message.content,
  type: message.type.toLowerCase() as 'text' | 'system' | 'file',
  parentId: message.parentId,
  editedAt: message.editedAt?.toISOString() ?? null,
  createdAt: message.createdAt.toISOString(),
  updatedAt: message.updatedAt.toISOString(),
  user: {
    id: message.user.id,
    displayName: message.user.displayName,
    avatarUrl: message.user.avatarUrl,
    status: message.user.status.toLowerCase() as 'online' | 'away' | 'offline'
  },
  attachments: message.attachments.map((attachment) => ({
    ...attachment,
    createdAt: attachment.createdAt.toISOString()
  }))
})

export const listMessages = async (
  payload: TokenPayload,
  channelId: string,
  options: { cursor?: string; limit: number; direction: 'before' | 'after' }
): Promise<PaginatedResponse<ReturnType<typeof serializeMessage>>> => {
  await channelAccess.ensureChannelMembership(channelId, payload.sub)

  const cursorMessage = options.cursor ? await prisma.message.findUnique({ where: { id: options.cursor } }) : null

  const createdAtFilter =
    cursorMessage && options.direction === 'before'
      ? { lt: cursorMessage.createdAt }
      : cursorMessage && options.direction === 'after'
        ? { gt: cursorMessage.createdAt }
        : null

  const where = {
    channelId,
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {})
  }

  const records = await prisma.message.findMany({
    where,
    include: messageInclude,
    orderBy: { createdAt: options.direction === 'after' ? 'asc' : 'desc' },
    take: options.limit
  })

  const normalized = (options.direction === 'after' ? records : [...records].reverse()).map((message) =>
    serializeMessage(message)
  )

  return {
    items: normalized,
    nextCursor: normalized.at(-1)?.id ?? null,
    prevCursor: normalized.at(0)?.id ?? null
  }
}

export const sendMessage = async (
  payload: TokenPayload,
  channelId: string,
  input: { content: string; type?: 'text' | 'system' | 'file'; parentId?: string }
) => {
  await channelAccess.ensureChannelMembership(channelId, payload.sub)

  const data = {
    channelId,
    userId: payload.sub,
    content: input.content,
    type: (input.type ?? 'text').toUpperCase() as MessageType,
    ...(input.parentId ? { parentId: input.parentId } : {})
  }

  const message = await prisma.message.create({
    data,
    include: messageInclude
  })

  const serialized = serializeMessage(message)
  getSocketServer()?.to(`channel:${channelId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, serialized)

  return serialized
}

export const editMessage = async (payload: TokenPayload, messageId: string, input: { content: string }) => {
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError(404, ERROR_CODES.MESSAGE_NOT_FOUND, 'Message not found')
  }
  if (message.userId !== payload.sub) {
    throw new AppError(403, ERROR_CODES.AUTH_FORBIDDEN, 'Only the sender can edit this message')
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: input.content, editedAt: new Date() },
    include: messageInclude
  })

  const serialized = serializeMessage(updated)
  getSocketServer()?.to(`channel:${updated.channelId}`).emit(SOCKET_EVENTS.MESSAGE_EDIT, serialized)

  return serialized
}

export const deleteMessage = async (payload: TokenPayload, messageId: string) => {
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError(404, ERROR_CODES.MESSAGE_NOT_FOUND, 'Message not found')
  }

  if (message.userId !== payload.sub) {
    await channelAccess.ensureChannelMembership(message.channelId, payload.sub, MemberRole.ADMIN)
  }

  await prisma.message.delete({ where: { id: messageId } })
  getSocketServer()?.to(`channel:${message.channelId}`).emit(SOCKET_EVENTS.MESSAGE_DELETE, {
    id: messageId,
    channelId: message.channelId
  })
}

export const markChannelRead = async (payload: TokenPayload, channelId: string, input: { lastReadAt?: string }) => {
  await channelAccess.ensureChannelMembership(channelId, payload.sub)

  return prisma.channelMember.update({
    where: {
      channelId_userId: {
        channelId,
        userId: payload.sub
      }
    },
    data: {
      lastReadAt: input.lastReadAt ? new Date(input.lastReadAt) : new Date()
    }
  })
}
