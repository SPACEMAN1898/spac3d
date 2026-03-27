import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function connectSocket(token: string): Socket {
  if (socket && socket.connected) {
    return socket
  }

  socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000', {
    transports: ['websocket'],
    auth: {
      token
    }
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
