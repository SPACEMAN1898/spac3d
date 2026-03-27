import { prisma } from '../lib/prisma'
import { AppError } from '../lib/errors'
import { ERROR_CODES } from '@clinikchat/shared'
import type { SendMessageInput, EditMessageInput, MessageCursorInput } from '@clinikchat/shared'

function formatMessage(msg: {
  id: string
  channelId: string
  userId: string
  content: string
  type: string
  parentId: string | null
  editedAt: Date | null
  createdAt: Date
  updatedAt: Date
  user?: { id: string; displayName: string; avatarUrl: string | null; status: string; lastSeenAt: Date | null } | null
  attachments?: Array<{ id: string; messageId: string; filename: string; mimeType: string; size: number; storageKey: string; createdAt: Date }>
}) {
  return {
    id: msg.id,
    channelId: msg.channelId,
    userId: msg.userId,
    content: msg.content,
    type: msg.type,
    parentId: msg.parentId,
    editedAt: msg.editedAt?.toISOString() ?? null,
    createdAt: msg.createdAt.toISOString(),
    updatedAt: msg.updatedAt.toISOString(),
    user: msg.user
      ? {
          id: msg.user.id,
          displayName: msg.user.displayName,
          avatarUrl: msg.user.avatarUrl,
          status: msg.user.status,
          lastSeenAt: msg.user.lastSeenAt?.toISOString() ?? null,
        }
      : undefined,
    attachments: msg.attachments?.map((a) => ({
      id: a.id,
      messageId: a.messageId,
      filename: a.filename,
      mimeType: a.mimeType,
      size: a.size,
      storageKey: a.storageKey,
      createdAt: a.createdAt.toISOString(),
    })),
  }
}

async function assertChannelMember(channelId: string, userId: string) {
  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  })
  if (!membership) {
    throw new AppError(403, ERROR_CODES.CHANNEL_FORBIDDEN, 'Not a member of this channel')
  }
  return membership
}

export async function getMessages(
  channelId: string,
  userId: string,
  cursor: MessageCursorInput,
) {
  await assertChannelMember(channelId, userId)

  const limit = cursor.limit ?? 50
  const direction = cursor.direction ?? 'before'

  const whereClause = cursor.cursor
    ? direction === 'before'
      ? { channelId, id: { lt: cursor.cursor } }
      : { channelId, id: { gt: cursor.cursor } }
    : { channelId }

  const messages = await prisma.message.findMany({
    where: whereClause,
    include: {
      user: true,
      attachments: true,
    },
    orderBy: { createdAt: direction === 'before' ? 'desc' : 'asc' },
    take: limit + 1,
  })

  const hasMore = messages.length > limit
  if (hasMore) messages.pop()

  const ordered = direction === 'before' ? messages.reverse() : messages
  const nextCursor = hasMore ? (ordered[ordered.length - 1]?.id ?? null) : null

  return {
    messages: ordered.map(formatMessage),
    hasMore,
    nextCursor,
  }
}

export async function sendMessage(channelId: string, userId: string, input: SendMessageInput) {
  await assertChannelMember(channelId, userId)

  const message = await prisma.message.create({
    data: {
      channelId,
      userId,
      content: input.content,
      type: input.type ?? 'TEXT',
      parentId: input.parentId ?? null,
    },
    include: {
      user: true,
      attachments: true,
    },
  })

  return formatMessage(message)
}

export async function editMessage(messageId: string, userId: string, input: EditMessageInput) {
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError(404, ERROR_CODES.MESSAGE_NOT_FOUND, 'Message not found')
  }
  if (message.userId !== userId) {
    throw new AppError(403, ERROR_CODES.MESSAGE_FORBIDDEN, 'You can only edit your own messages')
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: input.content, editedAt: new Date() },
    include: { user: true, attachments: true },
  })

  return formatMessage(updated)
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  })
  if (!message) {
    throw new AppError(404, ERROR_CODES.MESSAGE_NOT_FOUND, 'Message not found')
  }

  // Check if user is message owner or channel admin
  if (message.userId !== userId) {
    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: message.channelId, userId } },
    })
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new AppError(403, ERROR_CODES.MESSAGE_FORBIDDEN, 'Cannot delete this message')
    }
  }

  await prisma.message.delete({ where: { id: messageId } })
}
