import {
  addChannelMemberSchema,
  createChannelSchema,
  createDmChannelSchema,
  updateChannelSchema
} from '@clinikchat/shared'
import { Router } from 'express'
import { z } from 'zod'

import { authMiddleware } from '../middleware/auth.middleware.js'
import { validateObject } from '../middleware/validate.middleware.js'
import {
  addChannelMember,
  createChannel,
  createOrGetDmChannel,
  getChannel,
  listChannels,
  removeChannelMember,
  updateChannel
} from '../services/channel.service.js'

const orgParamsSchema = z.object({ orgId: z.uuid() })
const channelParamsSchema = z.object({ channelId: z.uuid() })
const removeMemberParamsSchema = z.object({ channelId: z.uuid(), userId: z.uuid() })

export const channelRouter = Router()

channelRouter.use(authMiddleware)

channelRouter.post(
  '/orgs/:orgId/channels',
  validateObject(orgParamsSchema, 'params'),
  validateObject(createChannelSchema),
  async (request, response, next) => {
    try {
      const { orgId } = orgParamsSchema.parse(request.params)
      const channel = await createChannel(request.user!, orgId, request.body)
      response.status(201).json({ success: true, data: channel })
    } catch (error) {
      next(error)
    }
  }
)

channelRouter.get('/orgs/:orgId/channels', validateObject(orgParamsSchema, 'params'), async (request, response, next) => {
  try {
    const { orgId } = orgParamsSchema.parse(request.params)
    const channels = await listChannels(request.user!, orgId)
    response.json({ success: true, data: channels })
  } catch (error) {
    next(error)
  }
})

channelRouter.post(
  '/orgs/:orgId/dm',
  validateObject(orgParamsSchema, 'params'),
  validateObject(createDmChannelSchema),
  async (request, response, next) => {
    try {
      const { orgId } = orgParamsSchema.parse(request.params)
      const channel = await createOrGetDmChannel(request.user!, orgId, request.body.userId)
      response.status(201).json({ success: true, data: channel })
    } catch (error) {
      next(error)
    }
  }
)

channelRouter.get('/channels/:channelId', validateObject(channelParamsSchema, 'params'), async (request, response, next) => {
  try {
    const { channelId } = channelParamsSchema.parse(request.params)
    const channel = await getChannel(request.user!, channelId)
    response.json({ success: true, data: channel })
  } catch (error) {
    next(error)
  }
})

channelRouter.patch(
  '/channels/:channelId',
  validateObject(channelParamsSchema, 'params'),
  validateObject(updateChannelSchema),
  async (request, response, next) => {
    try {
      const { channelId } = channelParamsSchema.parse(request.params)
      const channel = await updateChannel(request.user!, channelId, request.body)
      response.json({ success: true, data: channel })
    } catch (error) {
      next(error)
    }
  }
)

channelRouter.post(
  '/channels/:channelId/members',
  validateObject(channelParamsSchema, 'params'),
  validateObject(addChannelMemberSchema),
  async (request, response, next) => {
    try {
      const { channelId } = channelParamsSchema.parse(request.params)
      const membership = await addChannelMember(request.user!, channelId, request.body)
      response.status(201).json({ success: true, data: membership })
    } catch (error) {
      next(error)
    }
  }
)

channelRouter.delete(
  '/channels/:channelId/members/:userId',
  validateObject(removeMemberParamsSchema, 'params'),
  async (request, response, next) => {
    try {
      const { channelId, userId } = removeMemberParamsSchema.parse(request.params)
      await removeChannelMember(request.user!, channelId, userId)
      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
)
