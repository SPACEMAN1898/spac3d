import {
  ERROR_CODES,
  type AddChannelMemberSchema,
  type CreateChannelSchema,
  type CreateDmSchema,
  type UpdateChannelSchema
} from '@clinikchat/shared'
import { ChannelType, MemberRole } from '@prisma/client'

import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'

function toChannelType(value: 'public' | 'private' | 'dm'): ChannelType {
  if (value === 'private') return ChannelType.PRIVATE
  if (value === 'dm') return ChannelType.DM
  return ChannelType.PUBLIC
}

function toMemberRole(value: 'owner' | 'admin' | 'member'): MemberRole {
  if (value === 'owner') return MemberRole.OWNER
  if (value === 'admin') return MemberRole.ADMIN
  return MemberRole.MEMBER
}

async function requireOrgMembership(userId: string, orgId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } }
  })
  if (!membership) {
    throw new AppError('Organization access denied', 403, ERROR_CODES.ORG_ACCESS_DENIED)
  }
  return membership
}

async function requireChannelMembership(userId: string, channelId: string) {
  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
    include: { channel: true }
  })
  if (!membership) {
    throw new AppError('Channel access denied', 403, ERROR_CODES.CHANNEL_ACCESS_DENIED)
  }
  return membership
}

export async function createChannel(userId: string, orgId: string, input: CreateChannelSchema) {
  await requireOrgMembership(userId, orgId)
  const data: {
    orgId: string
    name: string
    topic?: string | null
    type: ChannelType
    createdById: string
    members: { create: { userId: string; role: MemberRole } }
  } = {
    orgId,
    name: input.name,
    type: toChannelType(input.type),
    createdById: userId,
    members: {
      create: {
        userId,
        role: MemberRole.OWNER
      }
    }
  }

  if (typeof input.topic !== 'undefined') {
    data.topic = input.topic
  }

  return prisma.channel.create({
    data
  })
}

export async function listChannels(userId: string, orgId: string) {
  await requireOrgMembership(userId, orgId)

  const channels = await prisma.channel.findMany({
    where: {
      orgId,
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      members: {
        where: { userId },
        select: { lastReadAt: true }
      },
      _count: {
        select: { messages: true }
      }
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }]
  })

  const withUnread = await Promise.all(
    channels.map(async (channel) => {
      const lastReadAt = channel.members[0]?.lastReadAt
      const where: {
        channelId: string
        userId: { not: string }
        deletedAt: null
        createdAt?: { gt: Date }
      } = {
        channelId: channel.id,
        userId: { not: userId },
        deletedAt: null
      }
      if (lastReadAt) {
        where.createdAt = { gt: lastReadAt }
      }

      const unreadCount = await prisma.message.count({
        where
      })

      return {
        ...channel,
        type: channel.type.toLowerCase(),
        unreadCount
      }
    }),
  )

  return withUnread
}

export async function getChannel(userId: string, channelId: string) {
  const membership = await requireChannelMembership(userId, channelId)
  return {
    ...membership.channel,
    type: membership.channel.type.toLowerCase()
  }
}

export async function updateChannel(userId: string, channelId: string, input: UpdateChannelSchema) {
  await requireChannelMembership(userId, channelId)
  const data: { name?: string; topic?: string | null } = {}
  if (typeof input.name !== 'undefined') {
    data.name = input.name
  }
  if (typeof input.topic !== 'undefined') {
    data.topic = input.topic
  }

  return prisma.channel.update({
    where: { id: channelId },
    data
  })
}

export async function addChannelMember(userId: string, channelId: string, input: AddChannelMemberSchema) {
  const membership = await requireChannelMembership(userId, channelId)
  if (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN) {
    throw new AppError('Channel access denied', 403, ERROR_CODES.CHANNEL_ACCESS_DENIED)
  }

  return prisma.channelMember.upsert({
    where: {
      channelId_userId: {
        channelId,
        userId: input.userId
      }
    },
    update: {
      role: toMemberRole(input.role)
    },
    create: {
      channelId,
      userId: input.userId,
      role: toMemberRole(input.role)
    }
  })
}

export async function removeChannelMember(userId: string, channelId: string, targetUserId: string) {
  const membership = await requireChannelMembership(userId, channelId)
  if (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN && userId !== targetUserId) {
    throw new AppError('Channel access denied', 403, ERROR_CODES.CHANNEL_ACCESS_DENIED)
  }

  await prisma.channelMember.delete({
    where: {
      channelId_userId: {
        channelId,
        userId: targetUserId
      }
    }
  })
}

export async function createOrGetDmChannel(userId: string, orgId: string, input: CreateDmSchema) {
  await requireOrgMembership(userId, orgId)
  await requireOrgMembership(input.targetUserId, orgId)

  const existingDm = await prisma.channel.findFirst({
    where: {
      orgId,
      type: ChannelType.DM,
      members: {
        every: {
          userId: { in: [userId, input.targetUserId] }
        }
      }
    },
    include: {
      members: true
    }
  })

  if (existingDm && existingDm.members.length === 2) {
    return existingDm
  }

  return prisma.channel.create({
    data: {
      orgId,
      name: `dm-${userId.slice(0, 6)}-${input.targetUserId.slice(0, 6)}`,
      type: ChannelType.DM,
      createdById: userId,
      members: {
        create: [
          {
            userId,
            role: MemberRole.OWNER
          },
          {
            userId: input.targetUserId,
            role: MemberRole.MEMBER
          }
        ]
      }
    }
  })
}
