import { editMessageSchema, listMessagesSchema, markReadSchema, sendMessageSchema } from '@clinikchat/shared'
import { Router } from 'express'
import { z } from 'zod'

import { authMiddleware } from '../middleware/auth.middleware.js'
import { validateObject } from '../middleware/validate.middleware.js'
import { deleteMessage, editMessage, listMessages, markChannelRead, sendMessage } from '../services/message.service.js'

const channelParamsSchema = z.object({ channelId: z.uuid() })
const messageParamsSchema = z.object({ messageId: z.uuid() })

export const messageRouter = Router()

messageRouter.use(authMiddleware)

messageRouter.get(
  '/channels/:channelId/messages',
  validateObject(channelParamsSchema, 'params'),
  validateObject(listMessagesSchema, 'query'),
  async (request, response, next) => {
    try {
      const { channelId } = request.params as { channelId: string }
      const messages = await listMessages(request.user!, channelId, request.query as never)
      response.json({ success: true, data: messages })
    } catch (error) {
      next(error)
    }
  }
)

messageRouter.post(
  '/channels/:channelId/messages',
  validateObject(channelParamsSchema, 'params'),
  validateObject(sendMessageSchema),
  async (request, response, next) => {
    try {
      const { channelId } = request.params as { channelId: string }
      const message = await sendMessage(request.user!, channelId, request.body)
      response.status(201).json({ success: true, data: message })
    } catch (error) {
      next(error)
    }
  }
)

messageRouter.patch(
  '/messages/:messageId',
  validateObject(messageParamsSchema, 'params'),
  validateObject(editMessageSchema),
  async (request, response, next) => {
    try {
      const { messageId } = request.params as { messageId: string }
      const message = await editMessage(request.user!, messageId, request.body)
      response.json({ success: true, data: message })
    } catch (error) {
      next(error)
    }
  }
)

messageRouter.delete('/messages/:messageId', validateObject(messageParamsSchema, 'params'), async (request, response, next) => {
  try {
    const { messageId } = request.params as { messageId: string }
    await deleteMessage(request.user!, messageId)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

messageRouter.post(
  '/channels/:channelId/read',
  validateObject(channelParamsSchema, 'params'),
  validateObject(markReadSchema),
  async (request, response, next) => {
    try {
      const { channelId } = request.params as { channelId: string }
      const membership = await markChannelRead(request.user!, channelId, request.body)
      response.json({ success: true, data: membership })
    } catch (error) {
      next(error)
    }
  }
)
