import type { Server, Socket } from 'socket.io'
import { SOCKET_EVENTS } from '@clinikchat/shared'
import { sendMessageSchema, editMessageSchema } from '@clinikchat/shared'
import { prisma } from '../lib/prisma'

async function assertChannelMember(channelId: string, userId: string) {
  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  })
  return membership !== null
}

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
  user?: { id: string; displayName: string; avatarUrl: string | null; status: string } | null
  attachments?: Array<{ id: string; filename: string; mimeType: string; size: number; storageKey: string; createdAt: Date }>
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
        }
      : undefined,
    attachments: msg.attachments?.map((a) => ({
      id: a.id,
      filename: a.filename,
      mimeType: a.mimeType,
      size: a.size,
      storageKey: a.storageKey,
      createdAt: a.createdAt.toISOString(),
    })),
  }
}

export function setupMessageHandlers(io: Server, socket: Socket) {
  socket.on(
    SOCKET_EVENTS.MESSAGE_NEW,
    async (data: { channelId: string; content: string; parentId?: string }, callback?: (result: unknown) => void) => {
      try {
        const parsed = sendMessageSchema.safeParse({ content: data.content, parentId: data.parentId })
        if (!parsed.success) {
          callback?.({ error: 'Invalid message data' })
          return
        }

        const isMember = await assertChannelMember(data.channelId, socket.user.id)
        if (!isMember) {
          callback?.({ error: 'Not a channel member' })
          return
        }

        const message = await prisma.message.create({
          data: {
            channelId: data.channelId,
            userId: socket.user.id,
            content: parsed.data.content,
            type: 'TEXT',
            parentId: parsed.data.parentId ?? null,
          },
          include: { user: true, attachments: true },
        })

        const formatted = formatMessage(message)
        io.to(`channel:${data.channelId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, formatted)
        callback?.({ success: true, data: formatted })
      } catch (err) {
        console.error('Error handling MESSAGE_NEW:', err)
        callback?.({ error: 'Failed to send message' })
      }
    },
  )

  socket.on(
    SOCKET_EVENTS.MESSAGE_EDIT,
    async (data: { messageId: string; content: string }, callback?: (result: unknown) => void) => {
      try {
        const parsed = editMessageSchema.safeParse({ content: data.content })
        if (!parsed.success) {
          callback?.({ error: 'Invalid message data' })
          return
        }

        const message = await prisma.message.findUnique({ where: { id: data.messageId } })
        if (!message || message.userId !== socket.user.id) {
          callback?.({ error: 'Message not found or not authorized' })
          return
        }

        const updated = await prisma.message.update({
          where: { id: data.messageId },
          data: { content: parsed.data.content, editedAt: new Date() },
          include: { user: true, attachments: true },
        })

        const formatted = formatMessage(updated)
        io.to(`channel:${message.channelId}`).emit(SOCKET_EVENTS.MESSAGE_EDIT, formatted)
        callback?.({ success: true, data: formatted })
      } catch (err) {
        console.error('Error handling MESSAGE_EDIT:', err)
        callback?.({ error: 'Failed to edit message' })
      }
    },
  )

  socket.on(
    SOCKET_EVENTS.MESSAGE_DELETE,
    async (data: { messageId: string }, callback?: (result: unknown) => void) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: data.messageId } })
        if (!message) {
          callback?.({ error: 'Message not found' })
          return
        }

        if (message.userId !== socket.user.id) {
          const membership = await prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId: message.channelId, userId: socket.user.id } },
          })
          if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
            callback?.({ error: 'Not authorized to delete this message' })
            return
          }
        }

        await prisma.message.delete({ where: { id: data.messageId } })
        io.to(`channel:${message.channelId}`).emit(SOCKET_EVENTS.MESSAGE_DELETE, {
          messageId: data.messageId,
          channelId: message.channelId,
        })
        callback?.({ success: true })
      } catch (err) {
        console.error('Error handling MESSAGE_DELETE:', err)
        callback?.({ error: 'Failed to delete message' })
      }
    },
  )
}
