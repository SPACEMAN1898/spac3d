import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { registerSchema } from '@clinikchat/shared'
import type { RegisterInput, User, AuthResponse, ApiResponse } from '@clinikchat/shared'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import apiClient from '../lib/api'
import { useAuthStore } from '../stores/authStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data)
      login(res.data.data.user as User, res.data.data.accessToken)
      navigate('/app')
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message ?? 'Registration failed')
          : 'Registration failed'
      setError('root', { message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ClinikChat</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Display Name"
              type="text"
              placeholder="Your Name"
              autoComplete="name"
              error={errors.displayName?.message}
              {...register('displayName')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min 8 chars, one uppercase, one number"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {errors.root && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
