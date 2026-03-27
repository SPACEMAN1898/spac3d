import type { UserProfile } from './user'

export type MessageType = 'TEXT' | 'SYSTEM' | 'FILE'

export interface Attachment {
  id: string
  messageId: string
  filename: string
  mimeType: string
  size: number
  storageKey: string
  url?: string
  thumbnailUrl?: string
  createdAt: string
}

export interface Message {
  id: string
  channelId: string
  userId: string
  content: string
  type: MessageType
  parentId: string | null
  editedAt: string | null
  createdAt: string
  updatedAt: string
  user?: UserProfile
  attachments?: Attachment[]
}

export interface SendMessageRequest {
  content: string
  type?: MessageType
  parentId?: string
}

export interface EditMessageRequest {
  content: string
}

export interface MessageCursor {
  cursor?: string
  limit?: number
  direction?: 'before' | 'after'
}
