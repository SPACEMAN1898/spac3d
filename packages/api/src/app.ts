import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'

import { errorMiddleware } from './middleware/error.middleware'
import { apiRouter } from './routes'

const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

export const app = express()

app.use(helmet())
app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  }),
)
app.use(cookieParser())
app.use(express.json())

app.get('/api/v1/health', (_request, response) => {
  response.json({ success: true, data: { status: 'ok' } })
})

app.use('/api/v1', apiRouter)

app.use(errorMiddleware)
