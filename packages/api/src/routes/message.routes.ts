import { Router, type Router as RouterType } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { sendMessageSchema, editMessageSchema, messageCursorSchema } from '@clinikchat/shared'
import * as messageService from '../services/message.service'

const channelMessageRouter: RouterType = Router({ mergeParams: true })
const messageRouter: RouterType = Router()

channelMessageRouter.use(authMiddleware)
messageRouter.use(authMiddleware)

channelMessageRouter.get(
  '/',
  validate(messageCursorSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawQuery = req.query as { cursor?: string; limit?: string; direction?: string }
      const result = await messageService.getMessages(
        (req.params as { channelId: string })['channelId'],
        (req as AuthenticatedRequest).userId,
        {
          cursor: rawQuery.cursor,
          limit: rawQuery.limit ? parseInt(rawQuery.limit, 10) : 50,
          direction: (rawQuery.direction === 'after' ? 'after' : 'before') as 'before' | 'after',
        },
      )
      res.json({
        success: true,
        data: result.messages,
        pagination: { hasMore: result.hasMore, nextCursor: result.nextCursor, prevCursor: null },
      })
    } catch (err) {
      next(err)
    }
  },
)

channelMessageRouter.post(
  '/',
  validate(sendMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as { content: string; type?: 'TEXT' | 'SYSTEM' | 'FILE'; parentId?: string }
      const message = await messageService.sendMessage(
        (req.params as { channelId: string })['channelId'],
        (req as AuthenticatedRequest).userId,
        { content: body.content, type: body.type ?? 'TEXT', parentId: body.parentId },
      )
      res.status(201).json({ success: true, data: message })
    } catch (err) {
      next(err)
    }
  },
)

messageRouter.patch(
  '/:messageId',
  validate(editMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await messageService.editMessage(
        req.params['messageId'] ?? '',
        (req as AuthenticatedRequest).userId,
        req.body as { content: string },
      )
      res.json({ success: true, data: message })
    } catch (err) {
      next(err)
    }
  },
)

messageRouter.delete('/:messageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await messageService.deleteMessage(
      req.params['messageId'] ?? '',
      (req as AuthenticatedRequest).userId,
    )
    res.json({ success: true, data: null })
  } catch (err) {
    next(err)
  }
})

export { channelMessageRouter, messageRouter }
