import {
  createOrganizationSchema,
  inviteMemberSchema,
  updateOrganizationSchema
} from '@clinikchat/shared'
import { Router } from 'express'
import { z } from 'zod'

import { authMiddleware } from '../middleware/auth.middleware'
import { validateMiddleware } from '../middleware/validate.middleware'
import {
  createOrganization,
  getOrganization,
  inviteOrganizationMember,
  listOrganizationMembers,
  listOrganizations,
  updateOrganization
} from '../services/org.service'

const orgIdParamsSchema = z.object({ orgId: z.uuid() })

export const orgRouter = Router()

orgRouter.use(authMiddleware)

orgRouter.post('/', validateMiddleware(createOrganizationSchema), async (request, response, next) => {
  try {
    const org = await createOrganization(request.user!.sub, request.body)
    response.status(201).json({ success: true, data: org })
  } catch (error) {
    next(error)
  }
})

orgRouter.get('/', async (request, response, next) => {
  try {
    const orgs = await listOrganizations(request.user!.sub)
    response.json({ success: true, data: orgs })
  } catch (error) {
    next(error)
  }
})

orgRouter.get('/:orgId', validateMiddleware(orgIdParamsSchema, 'params'), async (request, response, next) => {
  try {
    const { orgId } = request.params as { orgId: string }
    const org = await getOrganization(request.user!.sub, orgId)
    response.json({ success: true, data: org })
  } catch (error) {
    next(error)
  }
})

orgRouter.patch(
  '/:orgId',
  validateMiddleware(orgIdParamsSchema, 'params'),
  validateMiddleware(updateOrganizationSchema),
  async (request, response, next) => {
    try {
      const { orgId } = request.params as { orgId: string }
      const org = await updateOrganization(request.user!.sub, orgId, request.body)
      response.json({ success: true, data: org })
    } catch (error) {
      next(error)
    }
  },
)

orgRouter.post(
  '/:orgId/invite',
  validateMiddleware(orgIdParamsSchema, 'params'),
  validateMiddleware(inviteMemberSchema),
  async (request, response, next) => {
    try {
      const { orgId } = request.params as { orgId: string }
      const member = await inviteOrganizationMember(request.user!.sub, orgId, request.body)
      response.status(201).json({ success: true, data: member })
    } catch (error) {
      next(error)
    }
  },
)

orgRouter.get(
  '/:orgId/members',
  validateMiddleware(orgIdParamsSchema, 'params'),
  async (request, response, next) => {
    try {
      const { orgId } = request.params as { orgId: string }
      const members = await listOrganizationMembers(request.user!.sub, orgId)
      response.json({ success: true, data: members })
    } catch (error) {
      next(error)
    }
  },
)
