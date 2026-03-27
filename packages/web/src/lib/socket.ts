import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const connectSocket = (token: string) => {
  if (socket?.connected) {
    socket.auth = { token }
    return socket
  }

  socket = io(socketUrl, {
    autoConnect: true,
    transports: ['websocket'],
    auth: { token }
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}
