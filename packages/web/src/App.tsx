import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/app/ProtectedRoute'
import { AppShellPage } from './pages/AppShellPage'
import { ChannelPage } from './pages/ChannelPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShellPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<div />} />
        <Route path=":orgSlug/:channelId" element={<ChannelPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
