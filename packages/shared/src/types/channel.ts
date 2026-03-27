import type { UserProfile } from './user'

export type ChannelType = 'PUBLIC' | 'PRIVATE' | 'DM'
export type ChannelMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface Channel {
  id: string
  orgId: string
  name: string
  topic: string | null
  type: ChannelType
  createdById: string
  createdAt: string
  updatedAt: string
  unreadCount?: number
}

export interface ChannelWithMembers extends Channel {
  members: ChannelMember[]
}

export interface ChannelMember {
  channelId: string
  userId: string
  role: ChannelMemberRole
  lastReadAt: string | null
  joinedAt: string
  user?: UserProfile
}

export interface CreateChannelRequest {
  name: string
  topic?: string
  type: ChannelType
}

export interface UpdateChannelRequest {
  name?: string
  topic?: string | null
}

export interface CreateDmRequest {
  targetUserId: string
}
