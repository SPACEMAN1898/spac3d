import {
  createOrganizationSchema,
  inviteOrganizationMemberSchema,
  updateOrganizationSchema
} from '@clinikchat/shared'
import { Router } from 'express'
import { z } from 'zod'

import { authMiddleware } from '../middleware/auth.middleware.js'
import { validateObject } from '../middleware/validate.middleware.js'
import {
  createOrganization,
  getOrganization,
  inviteOrganizationMember,
  listOrganizationMembers,
  listOrganizations,
  updateOrganization
} from '../services/org.service.js'

const paramsSchema = z.object({ orgId: z.uuid() })

export const orgRouter = Router()

orgRouter.use(authMiddleware)

orgRouter.post('/', validateObject(createOrganizationSchema), async (request, response, next) => {
  try {
    const organization = await createOrganization(request.user!, request.body)
    response.status(201).json({ success: true, data: organization })
  } catch (error) {
    next(error)
  }
})

orgRouter.get('/', async (request, response, next) => {
  try {
    const organizations = await listOrganizations(request.user!)
    response.json({ success: true, data: organizations })
  } catch (error) {
    next(error)
  }
})

orgRouter.get('/:orgId', validateObject(paramsSchema, 'params'), async (request, response, next) => {
  try {
    const { orgId } = request.params as { orgId: string }
    const organization = await getOrganization(request.user!, orgId)
    response.json({ success: true, data: organization })
  } catch (error) {
    next(error)
  }
})

orgRouter.patch(
  '/:orgId',
  validateObject(paramsSchema, 'params'),
  validateObject(updateOrganizationSchema),
  async (request, response, next) => {
    try {
      const { orgId } = request.params as { orgId: string }
      const organization = await updateOrganization(request.user!, orgId, request.body)
      response.json({ success: true, data: organization })
    } catch (error) {
      next(error)
    }
  }
)

orgRouter.post(
  '/:orgId/invite',
  validateObject(paramsSchema, 'params'),
  validateObject(inviteOrganizationMemberSchema),
  async (request, response, next) => {
    try {
      const { orgId } = request.params as { orgId: string }
      const member = await inviteOrganizationMember(request.user!, orgId, request.body)
      response.status(201).json({ success: true, data: member })
    } catch (error) {
      next(error)
    }
  }
)

orgRouter.get('/:orgId/members', validateObject(paramsSchema, 'params'), async (request, response, next) => {
  try {
    const { orgId } = request.params as { orgId: string }
    const members = await listOrganizationMembers(request.user!, orgId)
    response.json({ success: true, data: members })
  } catch (error) {
    next(error)
  }
})
