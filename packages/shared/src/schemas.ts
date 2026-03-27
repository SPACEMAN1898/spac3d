import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80).trim(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(80).trim().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  status: z.enum(["online", "away", "offline"]).optional(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(120).trim().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export const createChannelSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  type: z.enum(["public", "private"]).default("public"),
  description: z.string().max(500).optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(80).trim().optional(),
  description: z.string().max(500).nullable().optional(),
});

export const createDmSchema = z.object({
  userId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  parentId: z.string().uuid().optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const messageCursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const markReadSchema = z.object({
  lastMessageId: z.string().uuid(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
export type CreateDmInput = z.infer<typeof createDmSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type MessageCursorQuery = z.infer<typeof messageCursorSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
