import 'dotenv/config';
import { createServer } from 'node:http';
import app from './app.js';
import { initSocketIO } from './sockets/index.js';
import { prisma } from './lib/prisma.js';

const PORT = parseInt(process.env.API_PORT || '3001', 10);

const httpServer = createServer(app);
const io = initSocketIO(httpServer);

app.set('io', io);

async function start() {
  try {
    await prisma.$connect();
    console.log('Connected to database');
  } catch (err) {
    console.warn('Could not connect to database:', (err as Error).message);
    console.warn('Server will start anyway — run docker:dev first for DB access');
  }

  httpServer.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

start();
