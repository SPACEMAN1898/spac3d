import type { MemberRole } from './channel'
import type { User } from './user'

export interface Organization {
  id: string
  name: string
  slug: string
  ownerId: string
  settings: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  id: string
  orgId: string
  userId: string
  role: MemberRole
  joinedAt: string
  user?: Pick<User, 'id' | 'email' | 'displayName' | 'avatarUrl' | 'status'>
}
