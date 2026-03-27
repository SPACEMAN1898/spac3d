import type { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | undefined

export const setSocketServer = (server: SocketIOServer) => {
  io = server
}

export const getSocketServer = () => io
