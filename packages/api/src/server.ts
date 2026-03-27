import http from 'http'
import app from './app'
import { initSocketIO } from './sockets'
import { prisma } from './lib/prisma'

const PORT = parseInt(process.env['PORT'] ?? '3000', 10)

const httpServer = http.createServer(app)

initSocketIO(httpServer)

async function start() {
  try {
    await prisma.$connect()
    console.log('Database connected')
  } catch (err) {
    console.error('Failed to connect to database:', err)
    process.exit(1)
  }

  httpServer.listen(PORT, () => {
    console.log(`ClinikChat API running on http://localhost:${PORT}`)
    console.log(`Environment: ${process.env['NODE_ENV'] ?? 'development'}`)
  })
}

start().catch((err) => {
  console.error('Server startup error:', err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await prisma.$disconnect()
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
