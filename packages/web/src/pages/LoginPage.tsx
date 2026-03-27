import { API_ROUTES, loginSchema } from '@clinikchat/shared'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthForm } from '../components/AuthForm'
import { api } from '../lib/api'
import { connectSocket } from '../lib/socket'
import { useAuthStore } from '../store/auth.store'

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <div className="min-h-screen bg-contentBg p-6">
      <AuthForm
        title="Sign in to ClinikChat"
        submitLabel="Login"
        fields={[
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'password', label: 'Password', type: 'password' }
        ]}
        errors={errors}
        onSubmit={async (values) => {
          setErrors({})
          const parsed = loginSchema.safeParse(values)
          if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors
            setErrors({
              email: fieldErrors.email?.[0] ?? '',
              password: fieldErrors.password?.[0] ?? ''
            })
            return
          }

          try {
            const response = await api.post(API_ROUTES.auth.login, parsed.data)
            const data = response.data.data
            setSession(data.accessToken, data.user)
            connectSocket(data.accessToken)
            navigate('/app', { replace: true })
          } catch {
            setErrors({ form: 'Unable to login. Check your credentials.' })
          }
        }}
      />

      <p className="mx-auto mt-4 max-w-md text-center text-sm text-gray-600">
        No account yet?{' '}
        <Link to="/register" className="font-medium text-brand">
          Register
        </Link>
      </p>
    </div>
  )
}
