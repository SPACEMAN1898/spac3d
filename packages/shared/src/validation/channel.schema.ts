import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/, 'Slug must use lowercase letters, numbers, and dashes')
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/).optional()
})

export const inviteMemberSchema = z.object({
  email: z.email('A valid email is required'),
  role: z.enum(['owner', 'admin', 'member']).default('member')
})

export const createChannelSchema = z.object({
  name: z.string().min(1).max(80),
  topic: z.string().max(240).optional(),
  type: z.enum(['public', 'private', 'dm']).default('public')
})

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  topic: z.string().max(240).nullable().optional()
})

export const addChannelMemberSchema = z.object({
  userId: z.uuid(),
  role: z.enum(['owner', 'admin', 'member']).default('member')
})

export const createDmSchema = z.object({
  targetUserId: z.uuid()
})

export type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationSchema = z.infer<typeof updateOrganizationSchema>
export type InviteMemberSchema = z.infer<typeof inviteMemberSchema>
export type CreateChannelSchema = z.infer<typeof createChannelSchema>
export type UpdateChannelSchema = z.infer<typeof updateChannelSchema>
export type AddChannelMemberSchema = z.infer<typeof addChannelMemberSchema>
export type CreateDmSchema = z.infer<typeof createDmSchema>
