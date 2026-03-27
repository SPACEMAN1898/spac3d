import { ERROR_CODES, type CreateOrganizationSchema, type InviteMemberSchema, type UpdateOrganizationSchema } from '@clinikchat/shared'
import { MemberRole } from '@prisma/client'

import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'

function toRole(role: 'owner' | 'admin' | 'member'): MemberRole {
  if (role === 'owner') return MemberRole.OWNER
  if (role === 'admin') return MemberRole.ADMIN
  return MemberRole.MEMBER
}

async function getMembershipOrThrow(userId: string, orgId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } }
  })
  if (!membership) {
    throw new AppError('Organization access denied', 403, ERROR_CODES.ORG_ACCESS_DENIED)
  }
  return membership
}

export async function createOrganization(userId: string, input: CreateOrganizationSchema) {
  return prisma.organization.create({
    data: {
      name: input.name,
      slug: input.slug,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: MemberRole.OWNER
        }
      }
    }
  })
}

export async function listOrganizations(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: { org: true },
    orderBy: { joinedAt: 'asc' }
  })

  return memberships.map(({ org, role }) => ({
    ...org,
    role: role.toLowerCase()
  }))
}

export async function getOrganization(userId: string, orgId: string) {
  await getMembershipOrThrow(userId, orgId)
  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org) {
    throw new AppError('Organization not found', 404, ERROR_CODES.ORG_NOT_FOUND)
  }
  return org
}

export async function updateOrganization(userId: string, orgId: string, input: UpdateOrganizationSchema) {
  const membership = await getMembershipOrThrow(userId, orgId)
  if (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN) {
    throw new AppError('Organization access denied', 403, ERROR_CODES.ORG_ACCESS_DENIED)
  }

  const data: { name?: string; slug?: string } = {}
  if (input.name !== undefined) data.name = input.name
  if (input.slug !== undefined) data.slug = input.slug

  return prisma.organization.update({
    where: { id: orgId },
    data
  })
}

export async function inviteOrganizationMember(userId: string, orgId: string, input: InviteMemberSchema) {
  const membership = await getMembershipOrThrow(userId, orgId)
  if (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN) {
    throw new AppError('Organization access denied', 403, ERROR_CODES.ORG_ACCESS_DENIED)
  }

  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND)
  }

  return prisma.organizationMember.upsert({
    where: { orgId_userId: { orgId, userId: user.id } },
    update: { role: toRole(input.role) },
    create: {
      orgId,
      userId: user.id,
      role: toRole(input.role)
    }
  })
}

export async function listOrganizationMembers(userId: string, orgId: string) {
  await getMembershipOrThrow(userId, orgId)
  const members = await prisma.organizationMember.findMany({
    where: { orgId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          status: true
        }
      }
    },
    orderBy: { joinedAt: 'asc' }
  })

  return members.map((member) => ({
    user: {
      ...member.user,
      status: member.user.status.toLowerCase()
    },
    role: member.role.toLowerCase(),
    joinedAt: member.joinedAt
  }))
}
