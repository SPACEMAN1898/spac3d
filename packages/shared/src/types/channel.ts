import type { User } from './user'

export type ChannelType = 'public' | 'private' | 'dm'
export type MemberRole = 'owner' | 'admin' | 'member'

export interface ChannelMember {
  id: string
  channelId: string
  userId: string
  role: MemberRole
  lastReadAt?: string | null
  joinedAt: string
  user?: Pick<User, 'id' | 'displayName' | 'avatarUrl' | 'status'>
}

export interface Channel {
  id: string
  orgId: string
  name: string
  topic?: string | null
  type: ChannelType
  createdById: string
  createdAt: string
  updatedAt: string
  unreadCount?: number
  members?: ChannelMember[]
}
