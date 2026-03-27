import { API_ROUTES, loginSchema, type LoginRequest, type User } from '@clinikchat/shared'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthForm } from '../components/auth/AuthForm'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'

const readRedirect = (state: unknown) => {
  if (typeof state === 'object' && state && 'from' in state && typeof (state as { from?: string }).from === 'string') {
    return (state as { from: string }).from
  }
  return '/app'
}

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((state) => state.setSession)

  const handleSubmit = async (values: LoginRequest) => {
    const response = await api.post(API_ROUTES.auth.login, values)
    setSession(response.data.data.tokens.accessToken, response.data.data.user as User)
    await navigate(readRedirect(location.state), { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <AuthForm<LoginRequest>
        title="Welcome back"
        subtitle="Sign in to ClinikChat to rejoin your care teams."
        schema={loginSchema}
        fields={[
          { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
          { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' }
        ]}
        submitLabel="Sign in"
        onSubmit={handleSubmit}
        footer={
          <>
            Need an account?{' '}
            <Link className="text-cyan-400 hover:text-cyan-300" to="/register">
              Register here
            </Link>
          </>
        }
      />
    </main>
  )
}
