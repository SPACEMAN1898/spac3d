import { Router } from 'express'

import { authRouter } from './auth.routes'
import { channelRouter } from './channel.routes'
import { messageRouter } from './message.routes'
import { orgRouter } from './org.routes'
import { userRouter } from './user.routes'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/users', userRouter)
apiRouter.use('/orgs', orgRouter)
apiRouter.use(channelRouter)
apiRouter.use(messageRouter)
