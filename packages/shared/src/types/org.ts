import type { UserProfile } from './user'

export type OrgMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface Organization {
  id: string
  name: string
  slug: string
  settings: Record<string, unknown>
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  orgId: string
  userId: string
  role: OrgMemberRole
  joinedAt: string
  user?: UserProfile
}

export interface CreateOrgRequest {
  name: string
  slug: string
}

export interface UpdateOrgRequest {
  name?: string
  settings?: Record<string, unknown>
}

export interface InviteToOrgRequest {
  email: string
  role?: OrgMemberRole
}
