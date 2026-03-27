import { API_ROUTES, registerSchema } from '@clinikchat/shared'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthForm } from '../components/AuthForm'
import { api } from '../lib/api'
import { connectSocket } from '../lib/socket'
import { useAuthStore } from '../store/auth.store'

export function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <div className="min-h-screen bg-contentBg p-6">
      <AuthForm
        title="Create ClinikChat account"
        submitLabel="Register"
        fields={[
          { name: 'displayName', label: 'Display name', type: 'text' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'password', label: 'Password', type: 'password' }
        ]}
        errors={errors}
        onSubmit={async (values) => {
          setErrors({})
          const parsed = registerSchema.safeParse(values)
          if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors
            setErrors({
              displayName: fieldErrors.displayName?.[0] ?? '',
              email: fieldErrors.email?.[0] ?? '',
              password: fieldErrors.password?.[0] ?? ''
            })
            return
          }

          try {
            const response = await api.post(API_ROUTES.auth.register, parsed.data)
            const data = response.data.data
            setSession(data.accessToken, data.user)
            connectSocket(data.accessToken)
            navigate('/app', { replace: true })
          } catch {
            setErrors({ form: 'Unable to register right now.' })
          }
        }}
      />

      <p className="mx-auto mt-4 max-w-md text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand">
          Login
        </Link>
      </p>
    </div>
  )
}
