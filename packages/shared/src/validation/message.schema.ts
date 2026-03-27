import { z } from 'zod'

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  type: z.enum(['text', 'system', 'file']).default('text'),
  parentId: z.uuid().optional()
})

export const editMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000)
})

export const listMessagesSchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  direction: z.enum(['before', 'after']).default('before')
})

export const markReadSchema = z.object({
  lastReadAt: z.iso.datetime().optional()
})

export type SendMessageSchema = z.infer<typeof sendMessageSchema>
export type EditMessageSchema = z.infer<typeof editMessageSchema>
