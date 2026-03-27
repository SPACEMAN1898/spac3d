import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { create } from 'zustand';

interface SocketState {
  status: 'connected' | 'reconnecting' | 'disconnected';
  setStatus: (s: SocketState['status']) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  status: 'disconnected',
  setStatus: (status) => set({ status }),
}));

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = useAuthStore.getState().accessToken;

  socket = io(import.meta.env.VITE_WS_URL || window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    useSocketStore.getState().setStatus('connected');
  });

  socket.on('disconnect', () => {
    useSocketStore.getState().setStatus('disconnected');
  });

  socket.io.on('reconnect_attempt', () => {
    useSocketStore.getState().setStatus('reconnecting');
  });

  socket.io.on('reconnect', () => {
    useSocketStore.getState().setStatus('connected');
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    useSocketStore.getState().setStatus('disconnected');
  }
}
