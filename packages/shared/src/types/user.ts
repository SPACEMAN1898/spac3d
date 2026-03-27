export type UserStatus = 'online' | 'away' | 'offline'

export interface UserProfile {
  bio?: string | null
  timezone?: string | null
}

export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  status: UserStatus
  lastSeenAt?: string | null
  profile?: UserProfile | null
  createdAt: string
  updatedAt: string
}
