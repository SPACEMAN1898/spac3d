import type { User } from './user'

export type MessageType = 'text' | 'system' | 'file'

export interface Attachment {
  id: string
  messageId: string
  filename: string
  mimeType: string
  size: number
  storageKey: string
  createdAt: string
  url?: string
  thumbnailUrl?: string
}

export interface Message {
  id: string
  channelId: string
  userId: string
  content: string
  type: MessageType
  parentId?: string | null
  editedAt?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  user?: Pick<User, 'id' | 'displayName' | 'avatarUrl' | 'status'>
  attachments?: Attachment[]
}
