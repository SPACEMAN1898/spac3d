export type MessageType = 'text' | 'system' | 'file'

export interface Attachment {
  id: string
  messageId: string
  filename: string
  mimeType: string
  size: number
  storageKey: string
  url?: string
  createdAt: string
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
  user?: {
    id: string
    displayName: string
    avatarUrl?: string | null
  }
  attachments?: Attachment[]
}
