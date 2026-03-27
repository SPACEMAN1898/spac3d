import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { errorMiddleware } from './middleware/error.middleware'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import orgRoutes from './routes/org.routes'
import { orgChannelRouter, channelRouter } from './routes/channel.routes'
import { channelMessageRouter, messageRouter } from './routes/message.routes'

const app: Express = express()

// Security
app.use(helmet())
app.use(
  cors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
  }),
)

// Parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(process.env['COOKIE_SECRET']))

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

// Routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/orgs', orgRoutes)
app.use('/api/v1/orgs/:orgId/channels', orgChannelRouter)
app.use('/api/v1/channels', channelRouter)
app.use('/api/v1/channels/:channelId/messages', channelMessageRouter)
app.use('/api/v1/messages', messageRouter)

// Global error handler (must be last)
app.use(errorMiddleware)

export default app
