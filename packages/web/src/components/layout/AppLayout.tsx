import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { connectSocket, disconnectSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';

export default function AppLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [accessToken]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden bg-white">
        <Outlet />
      </main>
    </div>
  );
}
