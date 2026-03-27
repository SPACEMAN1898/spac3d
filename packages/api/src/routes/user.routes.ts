import { Router } from 'express'

import { authMiddleware } from '../middleware/auth.middleware'
import { validateMiddleware } from '../middleware/validate.middleware'
import { getMe, updateMe, updateMeSchema } from '../services/user.service'

export const userRouter = Router()

userRouter.get('/me', authMiddleware, async (request, response, next) => {
  try {
    const user = await getMe(request.user!.sub)
    response.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})

userRouter.patch('/me', authMiddleware, validateMiddleware(updateMeSchema), async (request, response, next) => {
  try {
    const user = await updateMe(request.user!.sub, request.body)
    response.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})
