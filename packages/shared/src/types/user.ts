export type UserStatus = 'online' | 'away' | 'offline'

export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  status: UserStatus
  lastSeenAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  displayName: string
  avatarUrl?: string | null
  status: UserStatus
  lastSeenAt?: string | null
}
