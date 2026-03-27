import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(64, 'Organization name must be at most 64 characters')
    .trim(),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(32, 'Slug must be at most 32 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(64).trim().optional(),
});

export const inviteToOrgSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type InviteToOrgInput = z.infer<typeof inviteToOrgSchema>;
