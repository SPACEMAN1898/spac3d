import { ERROR_CODES } from '@clinikchat/shared'
import type { TokenPayload } from '@clinikchat/shared'

import { ChannelType, MemberRole } from '../generated/prisma/enums.js'
import { AppError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'

import { orgAccess } from './org.service.js'

const roleRank: Record<MemberRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3
}

const ensureChannelMembership = async (
  channelId: string,
  userId: string,
  minimumRole: MemberRole = MemberRole.MEMBER
) => {
  const membership = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId
      }
    },
    include: {
      channel: true
    }
  })

  const minimumRank = roleRank[minimumRole]

  if (!membership || roleRank[membership.role] < minimumRank) {
    throw new AppError(403, ERROR_CODES.AUTH_FORBIDDEN, 'You do not have access to this channel')
  }

  return membership
}

export const createChannel = async (
  payload: TokenPayload,
  orgId: string,
  input: { name: string; topic?: string; type?: 'public' | 'private' | 'dm' }
) => {
  await orgAccess.ensureMembership(orgId, payload.sub)

  const data = {
    orgId,
    name: input.name,
    type: (input.type ?? 'public').toUpperCase() as ChannelType,
    createdById: payload.sub,
    members: {
      create: {
        userId: payload.sub,
        role: MemberRole.OWNER
      }
    },
    ...(input.topic ? { topic: input.topic } : {})
  }

  return prisma.channel.create({
    data
  })
}

export const listChannels = async (payload: TokenPayload, orgId: string) => {
  await orgAccess.ensureMembership(orgId, payload.sub)

  const channels = await prisma.channel.findMany({
    where: {
      orgId,
      OR: [{ type: ChannelType.PUBLIC }, { members: { some: { userId: payload.sub } } }]
    },
    include: {
      members: {
        where: { userId: payload.sub },
        take: 1
      }
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }]
  })

  return Promise.all(
    channels.map(async (channel) => {
      const lastReadAt = channel.members[0]?.lastReadAt
      const where = {
        channelId: channel.id,
        userId: { not: payload.sub },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {})
      }
      const unreadCount = await prisma.message.count({
        where
      })

      return {
        id: channel.id,
        orgId: channel.orgId,
        name: channel.name,
        topic: channel.topic,
        type: channel.type.toLowerCase() as 'public' | 'private' | 'dm',
        createdById: channel.createdById,
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt.toISOString(),
        unreadCount
      }
    })
  )
}

export const getChannel = async (payload: TokenPayload, channelId: string) => {
  const membership = await ensureChannelMembership(channelId, payload.sub)
  return membership.channel
}

export const updateChannel = async (
  payload: TokenPayload,
  channelId: string,
  input: { name?: string; topic?: string }
) => {
  await ensureChannelMembership(channelId, payload.sub, MemberRole.ADMIN)
  return prisma.channel.update({ where: { id: channelId }, data: input })
}

export const addChannelMember = async (
  payload: TokenPayload,
  channelId: string,
  input: { userId: string; role: 'owner' | 'admin' | 'member' }
) => {
  const membership = await ensureChannelMembership(channelId, payload.sub, MemberRole.ADMIN)
  await orgAccess.ensureMembership(membership.channel.orgId, input.userId)

  return prisma.channelMember.upsert({
    where: {
      channelId_userId: {
        channelId,
        userId: input.userId
      }
    },
    update: {
      role: input.role.toUpperCase() as MemberRole
    },
    create: {
      channelId,
      userId: input.userId,
      role: input.role.toUpperCase() as MemberRole
    }
  })
}

export const removeChannelMember = async (payload: TokenPayload, channelId: string, userId: string) => {
  await ensureChannelMembership(channelId, payload.sub, MemberRole.ADMIN)
  await prisma.channelMember.delete({
    where: {
      channelId_userId: {
        channelId,
        userId
      }
    }
  })
}

export const createOrGetDmChannel = async (payload: TokenPayload, orgId: string, targetUserId: string) => {
  await orgAccess.ensureMembership(orgId, payload.sub)
  await orgAccess.ensureMembership(orgId, targetUserId)

  const existing = await prisma.channel.findFirst({
    where: {
      orgId,
      type: ChannelType.DM,
      members: {
        some: {
          userId: payload.sub
        }
      }
    },
    include: {
      members: true
    }
  })

  if (
    existing &&
    existing.members.length === 2 &&
    existing.members.some((member: { userId: string }) => member.userId === payload.sub) &&
    existing.members.some((member: { userId: string }) => member.userId === targetUserId)
  ) {
    return existing
  }

  return prisma.channel.create({
    data: {
      orgId,
      name: `dm-${payload.sub.slice(0, 6)}-${targetUserId.slice(0, 6)}`,
      type: ChannelType.DM,
      createdById: payload.sub,
      members: {
        create: [
          { userId: payload.sub, role: MemberRole.OWNER },
          { userId: targetUserId, role: MemberRole.MEMBER }
        ]
      }
    }
  })
}

export const channelAccess = { ensureChannelMembership }
