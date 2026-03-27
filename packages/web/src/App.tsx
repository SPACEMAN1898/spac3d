import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { queryClient } from './lib/query-client'
import { connectSocket, disconnectSocket } from './lib/socket'
import { AppHomePage } from './pages/AppHomePage'
import { ChannelPage } from './pages/ChannelPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { useAuthStore } from './store/auth.store'

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (accessToken) {
      connectSocket(accessToken)
      return () => {
        disconnectSocket()
      }
    }

    disconnectSocket()
    return undefined
  }, [accessToken])

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AppHomePage />} />
          <Route path=":orgSlug/:channelId" element={<ChannelPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </QueryClientProvider>
  )
}
