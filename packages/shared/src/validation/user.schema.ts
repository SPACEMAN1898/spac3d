import { z } from 'zod'

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(2).max(64).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  status: z.enum(['online', 'away', 'offline']).optional()
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required')
