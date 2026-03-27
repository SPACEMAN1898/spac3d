import { z } from 'zod';

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(80, 'Channel name must be at most 80 characters')
    .trim(),
  type: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  topic: z.string().max(250, 'Topic must be at most 250 characters').optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(80).trim().optional(),
  topic: z.string().max(250).optional(),
});

export const createDmSchema = z.object({
  targetUserId: z.string().uuid('Invalid user ID'),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
export type CreateDmInput = z.infer<typeof createDmSchema>;
