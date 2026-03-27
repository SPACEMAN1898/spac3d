import 'dotenv/config'

import { createServer } from 'http'

import { app } from './app'
import { prisma } from './lib/prisma'
import { initSocketServer } from './sockets'

const port = Number(process.env.PORT ?? 3000)
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

async function bootstrap() {
  await prisma.$connect()

  const server = createServer(app)
  initSocketServer(server, corsOrigin)

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API server listening on http://localhost:${port}`)
  })
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API server', error)
  process.exit(1)
})
