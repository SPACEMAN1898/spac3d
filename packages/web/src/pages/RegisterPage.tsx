import { API_ROUTES, registerSchema, type RegisterRequest, type User } from '@clinikchat/shared'
import { Link, useNavigate } from 'react-router-dom'

import { AuthForm } from '../components/auth/AuthForm'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const handleSubmit = async (values: RegisterRequest) => {
    const response = await api.post(API_ROUTES.auth.register, values)
    setSession(response.data.data.tokens.accessToken, response.data.data.user as User)
    await navigate('/app', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <AuthForm<RegisterRequest>
        title="Create workspace"
        subtitle="Set up ClinikChat for your team and start securely messaging."
        schema={registerSchema}
        fields={[
          { name: 'displayName', label: 'Display name', type: 'text', autoComplete: 'name' },
          { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
          { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' }
        ]}
        submitLabel="Create account"
        onSubmit={handleSubmit}
        footer={
          <>
            Already have an account?{' '}
            <Link className="text-cyan-400 hover:text-cyan-300" to="/login">
              Sign in
            </Link>
          </>
        }
      />
    </main>
  )
}
