import http from 'http'

import { createApp } from './app.js'
import { env } from './lib/env.js'
import { prisma } from './lib/prisma.js'
import { initializeSocketServer } from './sockets/index.js'

const bootstrap = async () => {
  await prisma.$connect().catch((error: unknown) => {
    console.error('Failed to connect to database', error)
  })

  const app = createApp()
  const server = http.createServer(app)
  initializeSocketServer(server)

  server.listen(env.apiPort, () => {
    console.log(`ClinikChat API listening on port ${env.apiPort}`)
  })
}

void bootstrap()
