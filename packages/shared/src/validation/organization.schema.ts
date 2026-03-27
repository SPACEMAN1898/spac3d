import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/)
})

export const updateOrganizationSchema = createOrganizationSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required'
)

export const inviteOrganizationMemberSchema = z.object({
  email: z.email(),
  role: z.enum(['owner', 'admin', 'member']).default('member')
})
