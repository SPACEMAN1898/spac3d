import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import OfflineBanner from '../ui/OfflineBanner';
import InstallPrompt from '../ui/InstallPrompt';
import { connectSocket, disconnectSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { SocketEvents } from '@clinikchat/shared';
import { requestNotificationPermission, showBrowserNotification } from '../../lib/notifications';

export default function AppLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setPresence = usePresenceStore((s) => s.setStatus);
  const { channelId: activeChannelId } = useParams();

  useEffect(() => {
    if (accessToken) {
      requestNotificationPermission();

      const socket = connectSocket();

      function handlePresence(data: { userId: string; status: 'ONLINE' | 'AWAY' | 'OFFLINE' }) {
        setPresence(data.userId, data.status);
      }

      function handleNewMessageNotification(msg: { channelId: string; content: string; user?: { displayName: string } }) {
        if (msg.channelId !== activeChannelId) {
          showBrowserNotification(
            msg.user?.displayName || 'New message',
            msg.content,
          );
        }
      }

      socket.on(SocketEvents.PRESENCE_UPDATE, handlePresence);
      socket.on(SocketEvents.MESSAGE_NEW, handleNewMessageNotification);

      return () => {
        socket.off(SocketEvents.PRESENCE_UPDATE, handlePresence);
        socket.off(SocketEvents.MESSAGE_NEW, handleNewMessageNotification);
        disconnectSocket();
      };
    }
    return undefined;
  }, [accessToken, setPresence, activeChannelId]);

  return (
    <div className="flex h-screen overflow-hidden">
      <OfflineBanner />
      <InstallPrompt />
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden bg-white">
        <Outlet />
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}
