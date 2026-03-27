import {
  editMessageSchema,
  markReadSchema,
  messageListQuerySchema,
  sendMessageSchema,
  SOCKET_EVENTS
} from '@clinikchat/shared'
import { Router } from 'express'
import { z } from 'zod'

import { authMiddleware } from '../middleware/auth.middleware'
import { validateMiddleware } from '../middleware/validate.middleware'
import { deleteMessage, editMessage, listMessages, markRead, sendMessage } from '../services/message.service'
import { getSocketServer } from '../sockets'

const channelParamsSchema = z.object({ channelId: z.uuid() })
const messageParamsSchema = z.object({ messageId: z.uuid() })

export const messageRouter = Router()

messageRouter.use(authMiddleware)

messageRouter.get(
  '/channels/:channelId/messages',
  validateMiddleware(channelParamsSchema, 'params'),
  validateMiddleware(messageListQuerySchema, 'query'),
  async (request, response, next) => {
    try {
      const { channelId } = request.params as { channelId: string }
      const query = messageListQuerySchema.parse(request.query)
      const result = await listMessages(request.user!.sub, channelId, query)
      response.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  },
)

messageRouter.post(
  '/channels/:channelId/messages',
  validateMiddleware(channelParamsSchema, 'params'),
  validateMiddleware(sendMessageSchema),
  async (request, response, next) => {
    try {
      const { channelId } = request.params as { channelId: string }
      const message = await sendMessage(request.user!.sub, channelId, request.body)
      getSocketServer()?.to(`channel:${channelId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, message)
      response.status(201).json({ success: true, data: message })
    } catch (error) {
      next(error)
    }
  },
)

messageRouter.patch('/messages/:messageId', validateMiddleware(messageParamsSchema, 'params'), validateMiddleware(editMessageSchema), async (request, response, next) => {
  try {
    const { messageId } = request.params as { messageId: string }
    const message = await editMessage(request.user!.sub, messageId, request.body)
    getSocketServer()?.to(`channel:${message.channelId}`).emit(SOCKET_EVENTS.MESSAGE_EDIT, message)
    response.json({ success: true, data: message })
  } catch (error) {
    next(error)
  }
})

messageRouter.delete('/messages/:messageId', validateMiddleware(messageParamsSchema, 'params'), async (request, response, next) => {
  try {
    const { messageId } = request.params as { messageId: string }
    await deleteMessage(request.user!.sub, messageId)
    getSocketServer()?.emit(SOCKET_EVENTS.MESSAGE_DELETE, { messageId })
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

messageRouter.post('/channels/:channelId/read', validateMiddleware(channelParamsSchema, 'params'), validateMiddleware(markReadSchema), async (request, response, next) => {
  try {
    const { channelId } = request.params as { channelId: string }
    const result = await markRead(request.user!.sub, channelId, request.body.lastReadAt)
    response.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})
