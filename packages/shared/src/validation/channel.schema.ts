import { z } from 'zod'

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(80, 'Channel name must be at most 80 characters')
    .regex(/^[a-z0-9-_]+$/, 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores')
    .trim(),
  topic: z.string().max(250, 'Topic must be at most 250 characters').trim().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'DM']).default('PUBLIC'),
})

export const updateChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(80, 'Channel name must be at most 80 characters')
    .regex(/^[a-z0-9-_]+$/, 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores')
    .trim()
    .optional(),
  topic: z.string().max(250, 'Topic must be at most 250 characters').trim().nullable().optional(),
})

export const addChannelMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
})

export const createDmSchema = z.object({
  targetUserId: z.string().uuid('Invalid user ID'),
})

export const createOrgSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name must be at most 100 characters')
    .trim(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .trim(),
})

export const updateOrgSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name must be at most 100 characters')
    .trim()
    .optional(),
  settings: z.record(z.unknown()).optional(),
})

export const inviteToOrgSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
})

export type CreateChannelInput = z.infer<typeof createChannelSchema>
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>
export type AddChannelMemberInput = z.infer<typeof addChannelMemberSchema>
export type CreateDmInput = z.infer<typeof createDmSchema>
export type CreateOrgInput = z.infer<typeof createOrgSchema>
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>
export type InviteToOrgInput = z.infer<typeof inviteToOrgSchema>
