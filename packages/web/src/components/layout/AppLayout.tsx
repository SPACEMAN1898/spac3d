import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import { connectSocket, disconnectSocket, getSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { SocketEvents } from '@clinikchat/shared';

export default function AppLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setPresence = usePresenceStore((s) => s.setStatus);

  useEffect(() => {
    if (accessToken) {
      const socket = connectSocket();

      function handlePresence(data: { userId: string; status: 'ONLINE' | 'AWAY' | 'OFFLINE' }) {
        setPresence(data.userId, data.status);
      }

      socket.on(SocketEvents.PRESENCE_UPDATE, handlePresence);

      return () => {
        socket.off(SocketEvents.PRESENCE_UPDATE, handlePresence);
        disconnectSocket();
      };
    }
    return undefined;
  }, [accessToken, setPresence]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden bg-white">
        <Outlet />
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}
