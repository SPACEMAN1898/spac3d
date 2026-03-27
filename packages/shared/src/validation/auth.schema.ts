import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const registerSchema = loginSchema.extend({
  displayName: z.string().min(2, 'Display name is too short').max(80, 'Display name is too long')
})

export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>
