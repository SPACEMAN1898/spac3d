import {
  addChannelMemberSchema,
  createChannelSchema,
  createDmSchema,
  updateChannelSchema
} from '@clinikchat/shared'
import { Router } from 'express'
import { z } from 'zod'

import { authMiddleware } from '../middleware/auth.middleware'
import { validateMiddleware } from '../middleware/validate.middleware'
import {
  addChannelMember,
  createChannel,
  createOrGetDmChannel,
  getChannel,
  listChannels,
  removeChannelMember,
  updateChannel
} from '../services/channel.service'

const orgIdSchema = z.object({ orgId: z.uuid() })
const channelIdSchema = z.object({ channelId: z.uuid() })
const memberParamsSchema = z.object({ channelId: z.uuid(), userId: z.uuid() })

export const channelRouter = Router()

channelRouter.use(authMiddleware)

channelRouter.post(
  '/orgs/:orgId/channels',
  validateMiddleware(orgIdSchema, 'params'),
  validateMiddleware(createChannelSchema),
  async (request, response, next) => {
    try {
      const { orgId } = request.params as { orgId: string }
      const channel = await createChannel(request.user!.sub, orgId, request.body)
      response.status(201).json({ success: true, data: channel })
    } catch (error) {
      next(error)
    }
  },
)

channelRouter.get('/orgs/:orgId/channels', validateMiddleware(orgIdSchema, 'params'), async (request, response, next) => {
  try {
    const { orgId } = request.params as { orgId: string }
    const channels = await listChannels(request.user!.sub, orgId)
    response.json({ success: true, data: channels })
  } catch (error) {
    next(error)
  }
})

channelRouter.post('/orgs/:orgId/dm', validateMiddleware(orgIdSchema, 'params'), validateMiddleware(createDmSchema), async (request, response, next) => {
  try {
    const { orgId } = request.params as { orgId: string }
    const channel = await createOrGetDmChannel(request.user!.sub, orgId, request.body)
    response.status(201).json({ success: true, data: channel })
  } catch (error) {
    next(error)
  }
})

channelRouter.get('/channels/:channelId', validateMiddleware(channelIdSchema, 'params'), async (request, response, next) => {
  try {
    const { channelId } = request.params as { channelId: string }
    const channel = await getChannel(request.user!.sub, channelId)
    response.json({ success: true, data: channel })
  } catch (error) {
    next(error)
  }
})

channelRouter.patch(
  '/channels/:channelId',
  validateMiddleware(channelIdSchema, 'params'),
  validateMiddleware(updateChannelSchema),
  async (request, response, next) => {
    try {
      const { channelId } = request.params as { channelId: string }
      const channel = await updateChannel(request.user!.sub, channelId, request.body)
      response.json({ success: true, data: channel })
    } catch (error) {
      next(error)
    }
  },
)

channelRouter.post(
  '/channels/:channelId/members',
  validateMiddleware(channelIdSchema, 'params'),
  validateMiddleware(addChannelMemberSchema),
  async (request, response, next) => {
    try {
      const { channelId } = request.params as { channelId: string }
      const member = await addChannelMember(request.user!.sub, channelId, request.body)
      response.status(201).json({ success: true, data: member })
    } catch (error) {
      next(error)
    }
  },
)

channelRouter.delete('/channels/:channelId/members/:userId', validateMiddleware(memberParamsSchema, 'params'), async (request, response, next) => {
  try {
    const { channelId, userId } = request.params as { channelId: string; userId: string }
    await removeChannelMember(request.user!.sub, channelId, userId)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})
