import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').max(64)
})

export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>
