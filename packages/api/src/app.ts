import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './lib/env.js'
import { errorMiddleware } from './middleware/error.middleware.js'
import { authRouter } from './routes/auth.routes.js'
import { channelRouter } from './routes/channel.routes.js'
import { messageRouter } from './routes/message.routes.js'
import { orgRouter } from './routes/org.routes.js'
import { userRouter } from './routes/user.routes.js'

export const createApp = () => {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin: env.webOrigin,
      credentials: true
    })
  )
  app.use(cookieParser())
  app.use(express.json())

  app.get('/api/v1/health', (_request, response) => {
    response.json({ success: true, data: { status: 'ok' } })
  })

  app.use('/api/v1/auth', authRouter)
  app.use('/api/v1/users', userRouter)
  app.use('/api/v1/orgs', orgRouter)
  app.use('/api/v1', channelRouter)
  app.use('/api/v1', messageRouter)

  app.use(errorMiddleware)

  return app
}
