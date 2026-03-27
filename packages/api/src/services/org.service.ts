import { ERROR_CODES } from '@clinikchat/shared'
import type { TokenPayload } from '@clinikchat/shared'

import { MemberRole } from '../generated/prisma/enums.js'
import { AppError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'

const roleRank: Record<MemberRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3
}

const toRole = (role: MemberRole) => role.toLowerCase() as 'owner' | 'admin' | 'member'

const ensureMembership = async (orgId: string, userId: string, minimumRole: MemberRole = MemberRole.MEMBER) => {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId
      }
    }
  })

  const minimumRank = roleRank[minimumRole]

  if (!membership || minimumRank === undefined || roleRank[membership.role] < minimumRank) {
    throw new AppError(403, ERROR_CODES.AUTH_FORBIDDEN, 'You do not have access to this organization')
  }

  return membership
}

export const createOrganization = async (payload: TokenPayload, input: { name: string; slug: string }) => {
  return prisma.organization.create({
    data: {
      name: input.name,
      slug: input.slug,
      ownerId: payload.sub,
      members: {
        create: {
          userId: payload.sub,
          role: MemberRole.OWNER
        }
      }
    }
  })
}

export const listOrganizations = async (payload: TokenPayload) => {
  return prisma.organization.findMany({
    where: {
      members: {
        some: { userId: payload.sub }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export const getOrganization = async (payload: TokenPayload, orgId: string) => {
  await ensureMembership(orgId, payload.sub)
  return prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
}

export const updateOrganization = async (
  payload: TokenPayload,
  orgId: string,
  input: { name?: string; slug?: string }
) => {
  await ensureMembership(orgId, payload.sub, MemberRole.ADMIN)
  return prisma.organization.update({ where: { id: orgId }, data: input })
}

export const inviteOrganizationMember = async (
  payload: TokenPayload,
  orgId: string,
  input: { email: string; role: 'owner' | 'admin' | 'member' }
) => {
  await ensureMembership(orgId, payload.sub, MemberRole.ADMIN)

  const invitedUser = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })
  if (!invitedUser) {
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found')
  }

  return prisma.organizationMember.upsert({
    where: {
      orgId_userId: {
        orgId,
        userId: invitedUser.id
      }
    },
    update: {
      role: input.role.toUpperCase() as MemberRole
    },
    create: {
      orgId,
      userId: invitedUser.id,
      role: input.role.toUpperCase() as MemberRole
    },
    include: {
      user: true
    }
  })
}

export const listOrganizationMembers = async (payload: TokenPayload, orgId: string) => {
  await ensureMembership(orgId, payload.sub)

  const members = await prisma.organizationMember.findMany({
    where: { orgId },
    include: { user: true },
    orderBy: { joinedAt: 'asc' }
  })

  return members.map((member) => ({
    ...member,
    role: toRole(member.role),
    joinedAt: member.joinedAt.toISOString(),
    user: member.user
      ? {
          id: member.user.id,
          email: member.user.email,
          displayName: member.user.displayName,
          avatarUrl: member.user.avatarUrl,
          status: member.user.status.toLowerCase() as 'online' | 'away' | 'offline'
        }
      : undefined
  }))
}

export const orgAccess = { ensureMembership }
