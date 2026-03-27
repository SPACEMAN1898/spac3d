import { z } from 'zod'

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(10000, 'Message is too long (max 10,000 characters)')
    .trim(),
  type: z.enum(['TEXT', 'SYSTEM', 'FILE']).default('TEXT'),
  parentId: z.string().uuid('Invalid parent message ID').optional(),
})

export const editMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(10000, 'Message is too long (max 10,000 characters)')
    .trim(),
})

export const messageCursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  direction: z.enum(['before', 'after']).default('before'),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type EditMessageInput = z.infer<typeof editMessageSchema>
export type MessageCursorInput = z.infer<typeof messageCursorSchema>
