import { prisma } from '../lib/prisma'
import { AppError } from '../lib/errors'
import { ERROR_CODES } from '@clinikchat/shared'
import type { CreateOrgInput, UpdateOrgInput, InviteToOrgInput } from '@clinikchat/shared'

function formatOrg(org: {
  id: string
  name: string
  slug: string
  settings: unknown
  ownerId: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    settings: org.settings as Record<string, unknown>,
    ownerId: org.ownerId,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  }
}

export async function createOrg(userId: string, input: CreateOrgInput) {
  const existing = await prisma.organization.findUnique({ where: { slug: input.slug } })
  if (existing) {
    throw new AppError(409, ERROR_CODES.ORG_SLUG_TAKEN, 'Organization slug is already taken')
  }

  const org = await prisma.$transaction(async (tx) => {
    const newOrg = await tx.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        ownerId: userId,
      },
    })

    await tx.organizationMember.create({
      data: { orgId: newOrg.id, userId, role: 'OWNER' },
    })

    // Create default #general channel
    const channel = await tx.channel.create({
      data: {
        orgId: newOrg.id,
        name: 'general',
        topic: 'General discussion',
        type: 'PUBLIC',
        createdById: userId,
      },
    })

    await tx.channelMember.create({
      data: { channelId: channel.id, userId, role: 'OWNER' },
    })

    return newOrg
  })

  return formatOrg(org)
}

export async function getUserOrgs(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: { org: true },
    orderBy: { joinedAt: 'asc' },
  })
  return memberships.map((m) => formatOrg(m.org))
}

export async function getOrgById(orgId: string, userId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
    include: { org: true },
  })
  if (!membership) {
    throw new AppError(404, ERROR_CODES.ORG_NOT_FOUND, 'Organization not found')
  }
  return formatOrg(membership.org)
}

export async function updateOrg(orgId: string, userId: string, input: UpdateOrgInput) {
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  })
  if (!membership) {
    throw new AppError(404, ERROR_CODES.ORG_NOT_FOUND, 'Organization not found')
  }
  if (!['OWNER', 'ADMIN'].includes(membership.role)) {
    throw new AppError(403, ERROR_CODES.ORG_FORBIDDEN, 'Insufficient permissions')
  }

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.settings !== undefined ? { settings: input.settings as object } : {}),
    },
  })
  return formatOrg(org)
}

export async function inviteToOrg(orgId: string, inviterId: string, input: InviteToOrgInput) {
  const inviterMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: inviterId } },
  })
  if (!inviterMembership) {
    throw new AppError(404, ERROR_CODES.ORG_NOT_FOUND, 'Organization not found')
  }
  if (!['OWNER', 'ADMIN'].includes(inviterMembership.role)) {
    throw new AppError(403, ERROR_CODES.ORG_FORBIDDEN, 'Insufficient permissions to invite members')
  }

  const targetUser = await prisma.user.findUnique({ where: { email: input.email } })
  if (!targetUser) {
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found')
  }

  const existing = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: targetUser.id } },
  })
  if (existing) {
    throw new AppError(409, ERROR_CODES.ORG_ALREADY_MEMBER, 'User is already a member')
  }

  const membership = await prisma.organizationMember.create({
    data: {
      orgId,
      userId: targetUser.id,
      role: input.role ?? 'MEMBER',
    },
    include: { user: true },
  })

  return {
    orgId: membership.orgId,
    userId: membership.userId,
    role: membership.role,
    joinedAt: membership.joinedAt.toISOString(),
    user: {
      id: membership.user.id,
      displayName: membership.user.displayName,
      avatarUrl: membership.user.avatarUrl,
      status: membership.user.status,
      lastSeenAt: membership.user.lastSeenAt?.toISOString() ?? null,
    },
  }
}

export async function getOrgMembers(orgId: string, userId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  })
  if (!membership) {
    throw new AppError(404, ERROR_CODES.ORG_NOT_FOUND, 'Organization not found')
  }

  const members = await prisma.organizationMember.findMany({
    where: { orgId },
    include: { user: true },
    orderBy: { joinedAt: 'asc' },
  })

  return members.map((m) => ({
    orgId: m.orgId,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    user: {
      id: m.user.id,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      status: m.user.status,
      lastSeenAt: m.user.lastSeenAt?.toISOString() ?? null,
    },
  }))
}
