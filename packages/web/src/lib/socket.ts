import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    throw new Error('Socket not initialized. Call connectSocket first.')
  }
  return socket
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket

  socket = io('/', {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  socket.on('connect', () => {
    console.log('Socket.IO connected:', socket?.id)
  })

  socket.on('connect_error', (err) => {
    console.error('Socket.IO connection error:', err.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason)
  })

  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false
}
