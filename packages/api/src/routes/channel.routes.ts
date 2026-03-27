import { Router, type Router as RouterType } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  createChannelSchema,
  updateChannelSchema,
  addChannelMemberSchema,
  createDmSchema,
} from '@clinikchat/shared'
import * as channelService from '../services/channel.service'

const orgChannelRouter: RouterType = Router({ mergeParams: true })
const channelRouter: RouterType = Router()

orgChannelRouter.use(authMiddleware)
channelRouter.use(authMiddleware)

// Org-scoped channel routes
orgChannelRouter.post(
  '/',
  validate(createChannelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await channelService.createChannel(
        (req.params as { orgId: string })['orgId'],
        (req as AuthenticatedRequest).userId,
        req.body as { name: string; topic?: string; type: 'PUBLIC' | 'PRIVATE' | 'DM' },
      )
      res.status(201).json({ success: true, data: channel })
    } catch (err) {
      next(err)
    }
  },
)

orgChannelRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channels = await channelService.getOrgChannels(
      (req.params as { orgId: string })['orgId'],
      (req as AuthenticatedRequest).userId,
    )
    res.json({ success: true, data: channels })
  } catch (err) {
    next(err)
  }
})

orgChannelRouter.post(
  '/dm',
  validate(createDmSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await channelService.createOrGetDm(
        (req.params as { orgId: string })['orgId'],
        (req as AuthenticatedRequest).userId,
        (req.body as { targetUserId: string }).targetUserId,
      )
      res.json({ success: true, data: channel })
    } catch (err) {
      next(err)
    }
  },
)

// Channel-scoped routes
channelRouter.get('/:channelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await channelService.getChannelById(
      req.params['channelId'] ?? '',
      (req as AuthenticatedRequest).userId,
    )
    res.json({ success: true, data: channel })
  } catch (err) {
    next(err)
  }
})

channelRouter.patch(
  '/:channelId',
  validate(updateChannelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await channelService.updateChannel(
        req.params['channelId'] ?? '',
        (req as AuthenticatedRequest).userId,
        req.body as { name?: string; topic?: string | null },
      )
      res.json({ success: true, data: channel })
    } catch (err) {
      next(err)
    }
  },
)

channelRouter.post(
  '/:channelId/members',
  validate(addChannelMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as { userId: string; role?: 'ADMIN' | 'MEMBER' }
      const member = await channelService.addChannelMember(
        req.params['channelId'] ?? '',
        (req as AuthenticatedRequest).userId,
        { userId: body.userId, role: body.role ?? 'MEMBER' },
      )
      res.status(201).json({ success: true, data: member })
    } catch (err) {
      next(err)
    }
  },
)

channelRouter.delete(
  '/:channelId/members/:userId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await channelService.removeChannelMember(
        req.params['channelId'] ?? '',
        (req as AuthenticatedRequest).userId,
        req.params['userId'] ?? '',
      )
      res.json({ success: true, data: null })
    } catch (err) {
      next(err)
    }
  },
)

channelRouter.post(
  '/:channelId/read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await channelService.markChannelRead(
        req.params['channelId'] ?? '',
        (req as AuthenticatedRequest).userId,
      )
      res.json({ success: true, data: null })
    } catch (err) {
      next(err)
    }
  },
)

export { orgChannelRouter, channelRouter }
