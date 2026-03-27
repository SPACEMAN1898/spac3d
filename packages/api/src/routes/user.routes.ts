import { Router, type Router as RouterType } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { updateProfileSchema } from '@clinikchat/shared'
import * as userService from '../services/user.service'

const router: RouterType = Router()

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById((req as AuthenticatedRequest).userId)
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
})

router.patch(
  '/me',
  authMiddleware,
  validate(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateUser(
        (req as AuthenticatedRequest).userId,
        req.body as { displayName?: string; avatarUrl?: string | null },
      )
      res.json({ success: true, data: user })
    } catch (err) {
      next(err)
    }
  },
)

export default router
