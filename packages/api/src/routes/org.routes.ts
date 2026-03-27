import { Router, type Router as RouterType } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { createOrgSchema, updateOrgSchema, inviteToOrgSchema } from '@clinikchat/shared'
import * as orgService from '../services/org.service'

const router: RouterType = Router()

router.use(authMiddleware)

router.post(
  '/',
  validate(createOrgSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const org = await orgService.createOrg(
        (req as AuthenticatedRequest).userId,
        req.body as { name: string; slug: string },
      )
      res.status(201).json({ success: true, data: org })
    } catch (err) {
      next(err)
    }
  },
)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await orgService.getUserOrgs((req as AuthenticatedRequest).userId)
    res.json({ success: true, data: orgs })
  } catch (err) {
    next(err)
  }
})

router.get('/:orgId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await orgService.getOrgById(
      req.params['orgId'] ?? '',
      (req as AuthenticatedRequest).userId,
    )
    res.json({ success: true, data: org })
  } catch (err) {
    next(err)
  }
})

router.patch(
  '/:orgId',
  validate(updateOrgSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const org = await orgService.updateOrg(
        req.params['orgId'] ?? '',
        (req as AuthenticatedRequest).userId,
        req.body as { name?: string; settings?: Record<string, unknown> },
      )
      res.json({ success: true, data: org })
    } catch (err) {
      next(err)
    }
  },
)

router.post(
  '/:orgId/invite',
  validate(inviteToOrgSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as { email: string; role?: 'ADMIN' | 'MEMBER' }
      const member = await orgService.inviteToOrg(
        req.params['orgId'] ?? '',
        (req as AuthenticatedRequest).userId,
        { email: body.email, role: body.role ?? 'MEMBER' },
      )
      res.status(201).json({ success: true, data: member })
    } catch (err) {
      next(err)
    }
  },
)

router.get('/:orgId/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await orgService.getOrgMembers(
      req.params['orgId'] ?? '',
      (req as AuthenticatedRequest).userId,
    )
    res.json({ success: true, data: members })
  } catch (err) {
    next(err)
  }
})

export default router
