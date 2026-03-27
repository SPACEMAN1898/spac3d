import {
  ERROR_CODES,
  type EditMessageSchema,
  type MessageListQuerySchema,
  type SendMessageSchema
} from '@clinikchat/shared'
import { MessageType } from '@prisma/client'

import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'

function toMessageType(value: 'text' | 'system' | 'file'): MessageType {
  if (value === 'system') return MessageType.SYSTEM
  if (value === 'file') return MessageType.FILE
  return MessageType.TEXT
}

async function requireChannelMembership(userId: string, channelId: string) {
  const membership = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId
      }
    }
  })
  if (!membership) {
    throw new AppError('Channel access denied', 403, ERROR_CODES.CHANNEL_ACCESS_DENIED)
  }
  return membership
}

export async function listMessages(userId: string, channelId: string, query: MessageListQuerySchema) {
  await requireChannelMembership(userId, channelId)

  const limit = query.limit ?? 50
  const direction = query.direction ?? 'before'
  let cursorDate: Date | undefined
  if (query.cursor) {
    const cursorMessage = await prisma.message.findUnique({
      where: { id: query.cursor },
      select: { createdAt: true }
    })
    cursorDate = cursorMessage?.createdAt
  }

  const where: {
    channelId: string
    deletedAt: null
    createdAt?: { lt: Date } | { gt: Date }
  } = {
    channelId,
    deletedAt: null
  }

  if (cursorDate) {
    where.createdAt = direction === 'before' ? { lt: cursorDate } : { gt: cursorDate }
  }

  const messages = await prisma.message.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true
        }
      },
      attachments: true
    },
    orderBy: {
      createdAt: direction === 'before' ? 'desc' : 'asc'
    },
    take: limit + 1
  })

  const hasMore = messages.length > limit
  const items = hasMore ? messages.slice(0, limit) : messages
  const normalized = direction === 'before' ? [...items].reverse() : items

  return {
    items: normalized,
    hasMore,
    nextCursor: normalized.at(-1)?.id ?? null,
    prevCursor: normalized[0]?.id ?? null
  }
}

export async function sendMessage(userId: string, channelId: string, input: SendMessageSchema) {
  await requireChannelMembership(userId, channelId)

  const messageData: {
    channelId: string
    userId: string
    content: string
    type: MessageType
    parentId?: string | null
  } = {
    channelId,
    userId,
    content: input.content,
    type: toMessageType(input.type)
  }
  if (input.parentId) {
    messageData.parentId = input.parentId
  }

  return prisma.message.create({
    data: messageData,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true
        }
      },
      attachments: true
    }
  })
}

export async function editMessage(userId: string, messageId: string, input: EditMessageSchema) {
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('Message not found', 404, ERROR_CODES.MESSAGE_NOT_FOUND)
  }
  if (message.userId !== userId) {
    throw new AppError('You cannot edit this message', 403, ERROR_CODES.MESSAGE_EDIT_FORBIDDEN)
  }

  return prisma.message.update({
    where: { id: messageId },
    data: {
      content: input.content,
      editedAt: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true
        }
      },
      attachments: true
    }
  })
}

export async function deleteMessage(userId: string, messageId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('Message not found', 404, ERROR_CODES.MESSAGE_NOT_FOUND)
  }

  const membership = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: {
        channelId: message.channelId,
        userId
      }
    }
  })

  if (!membership) {
    throw new AppError('Channel access denied', 403, ERROR_CODES.CHANNEL_ACCESS_DENIED)
  }

  if (
    message.userId !== userId &&
    membership.role !== 'OWNER' &&
    membership.role !== 'ADMIN'
  ) {
    throw new AppError('You cannot delete this message', 403, ERROR_CODES.MESSAGE_EDIT_FORBIDDEN)
  }

  await prisma.message.update({
    where: { id: messageId },
    data: {
      deletedAt: new Date(),
      content: '[deleted]'
    }
  })
}

export async function markRead(userId: string, channelId: string, lastReadAt?: string) {
  await requireChannelMembership(userId, channelId)

  return prisma.channelMember.update({
    where: {
      channelId_userId: {
        channelId,
        userId
      }
    },
    data: {
      lastReadAt: lastReadAt ? new Date(lastReadAt) : new Date()
    }
  })
}
