import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "../stores/authStore.js";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error("No access token for socket");
  }
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io("/", {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function reconnectSocket(): void {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    disconnectSocket();
    return;
  }
  if (socket) {
    socket.auth = { token };
    socket.disconnect();
    socket.connect();
    return;
  }
  try {
    connectSocket();
  } catch {
    /* no token */
  }
}
