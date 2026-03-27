import { updateUserSchema } from '@clinikchat/shared'
import { Router } from 'express'

import { authMiddleware } from '../middleware/auth.middleware.js'
import { validateObject } from '../middleware/validate.middleware.js'
import { getCurrentUser, updateCurrentUser } from '../services/user.service.js'

export const userRouter = Router()

userRouter.use(authMiddleware)

userRouter.get('/me', async (request, response, next) => {
  try {
    const user = await getCurrentUser(request.user!)
    response.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})

userRouter.patch('/me', validateObject(updateUserSchema), async (request, response, next) => {
  try {
    const user = await updateCurrentUser(request.user!, request.body)
    response.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})
