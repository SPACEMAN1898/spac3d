import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AppLayout from './components/layout/AppLayout';
import ChannelView from './pages/ChannelView';
import SettingsPage from './pages/SettingsPage';
import { useAuthStore } from './stores/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (token) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="settings" element={<SettingsPage />} />
        <Route path=":orgSlug/:channelId" element={<ChannelView />} />
        <Route index element={<WelcomeScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex h-full items-center justify-center text-gray-400">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-600">Welcome to ClinikChat</h2>
        <p className="mt-2">Select a channel from the sidebar to start chatting.</p>
      </div>
    </div>
  );
}
