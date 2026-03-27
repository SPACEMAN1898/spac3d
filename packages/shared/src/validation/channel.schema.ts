import { z } from 'zod'

export const createChannelSchema = z.object({
  name: z.string().trim().min(2).max(80),
  topic: z.string().trim().max(240).optional(),
  type: z.enum(['public', 'private', 'dm']).default('public')
})

export const updateChannelSchema = createChannelSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required'
)

export const addChannelMemberSchema = z.object({
  userId: z.uuid(),
  role: z.enum(['owner', 'admin', 'member']).default('member')
})

export const createDmChannelSchema = z.object({
  userId: z.uuid()
})

export type CreateChannelSchema = z.infer<typeof createChannelSchema>
export type UpdateChannelSchema = z.infer<typeof updateChannelSchema>
