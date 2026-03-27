import { prisma } from '../lib/prisma'
import { AppError } from '../lib/errors'
import { ERROR_CODES } from '@clinikchat/shared'
import type { CreateChannelInput, UpdateChannelInput, AddChannelMemberInput } from '@clinikchat/shared'

function formatChannel(
  channel: {
    id: string
    orgId: string
    name: string
    topic: string | null
    type: string
    createdById: string
    createdAt: Date
    updatedAt: Date
  },
  unreadCount?: number,
) {
  return {
    id: channel.id,
    orgId: channel.orgId,
    name: channel.name,
    topic: channel.topic,
    type: channel.type,
    createdById: channel.createdById,
    createdAt: channel.createdAt.toISOString(),
    updatedAt: channel.updatedAt.toISOString(),
    unreadCount: unreadCount ?? 0,
  }
}

async function assertOrgMember(orgId: string, userId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  })
  if (!membership) {
    throw new AppError(403, ERROR_CODES.ORG_FORBIDDEN, 'Not a member of this organization')
  }
  return membership
}

async function assertChannelMember(channelId: string, userId: string) {
  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  })
  if (!membership) {
    throw new AppError(403, ERROR_CODES.CHANNEL_FORBIDDEN, 'Not a member of this channel')
  }
  return membership
}

export async function createChannel(orgId: string, userId: string, input: CreateChannelInput) {
  await assertOrgMember(orgId, userId)

  const channel = await prisma.$transaction(async (tx) => {
    const newChannel = await tx.channel.create({
      data: {
        orgId,
        name: input.name,
        topic: input.topic ?? null,
        type: input.type,
        createdById: userId,
      },
    })

    await tx.channelMember.create({
      data: { channelId: newChannel.id, userId, role: 'OWNER' },
    })

    return newChannel
  })

  return formatChannel(channel)
}

export async function getOrgChannels(orgId: string, userId: string) {
  await assertOrgMember(orgId, userId)

  const memberships = await prisma.channelMember.findMany({
    where: {
      userId,
      channel: { orgId },
    },
    include: {
      channel: true,
    },
    orderBy: { joinedAt: 'asc' },
  })

  const channelsWithUnread = await Promise.all(
    memberships.map(async (m) => {
      const unreadCount = m.lastReadAt
        ? await prisma.message.count({
            where: {
              channelId: m.channelId,
              createdAt: { gt: m.lastReadAt },
            },
          })
        : await prisma.message.count({ where: { channelId: m.channelId } })
      return formatChannel(m.channel, unreadCount)
    }),
  )

  return channelsWithUnread
}

export async function getChannelById(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { members: { include: { user: true } } },
  })
  if (!channel) {
    throw new AppError(404, ERROR_CODES.CHANNEL_NOT_FOUND, 'Channel not found')
  }

  await assertOrgMember(channel.orgId, userId)

  if (channel.type !== 'PUBLIC') {
    await assertChannelMember(channelId, userId)
  }

  return {
    ...formatChannel(channel),
    members: channel.members.map((m) => ({
      channelId: m.channelId,
      userId: m.userId,
      role: m.role,
      lastReadAt: m.lastReadAt?.toISOString() ?? null,
      joinedAt: m.joinedAt.toISOString(),
      user: {
        id: m.user.id,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        status: m.user.status,
        lastSeenAt: m.user.lastSeenAt?.toISOString() ?? null,
      },
    })),
  }
}

export async function updateChannel(channelId: string, userId: string, input: UpdateChannelInput) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) {
    throw new AppError(404, ERROR_CODES.CHANNEL_NOT_FOUND, 'Channel not found')
  }

  const membership = await assertChannelMember(channelId, userId)
  if (!['OWNER', 'ADMIN'].includes(membership.role)) {
    throw new AppError(403, ERROR_CODES.CHANNEL_FORBIDDEN, 'Insufficient permissions')
  }

  const updated = await prisma.channel.update({
    where: { id: channelId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.topic !== undefined ? { topic: input.topic } : {}),
    },
  })
  return formatChannel(updated)
}

export async function addChannelMember(
  channelId: string,
  requesterId: string,
  input: AddChannelMemberInput,
) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) {
    throw new AppError(404, ERROR_CODES.CHANNEL_NOT_FOUND, 'Channel not found')
  }

  await assertOrgMember(channel.orgId, requesterId)
  await assertOrgMember(channel.orgId, input.userId)

  const existing = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId: input.userId } },
  })
  if (existing) {
    throw new AppError(409, ERROR_CODES.CHANNEL_ALREADY_MEMBER, 'User is already a channel member')
  }

  const membership = await prisma.channelMember.create({
    data: {
      channelId,
      userId: input.userId,
      role: input.role ?? 'MEMBER',
    },
    include: { user: true },
  })

  return {
    channelId: membership.channelId,
    userId: membership.userId,
    role: membership.role,
    lastReadAt: null,
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

export async function removeChannelMember(
  channelId: string,
  requesterId: string,
  targetUserId: string,
) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) {
    throw new AppError(404, ERROR_CODES.CHANNEL_NOT_FOUND, 'Channel not found')
  }

  const requesterMembership = await assertChannelMember(channelId, requesterId)
  if (requesterId !== targetUserId && !['OWNER', 'ADMIN'].includes(requesterMembership.role)) {
    throw new AppError(403, ERROR_CODES.CHANNEL_FORBIDDEN, 'Insufficient permissions')
  }

  await prisma.channelMember.delete({
    where: { channelId_userId: { channelId, userId: targetUserId } },
  })
}

export async function createOrGetDm(orgId: string, userId: string, targetUserId: string) {
  await assertOrgMember(orgId, userId)
  await assertOrgMember(orgId, targetUserId)

  // Look for existing DM channel between these two users in this org
  const existingDm = await prisma.channel.findFirst({
    where: {
      orgId,
      type: 'DM',
      members: {
        every: { userId: { in: [userId, targetUserId] } },
      },
    },
    include: {
      members: true,
    },
  })

  if (existingDm && existingDm.members.length === 2) {
    return formatChannel(existingDm)
  }

  // Create new DM channel
  const dm = await prisma.$transaction(async (tx) => {
    const channel = await tx.channel.create({
      data: {
        orgId,
        name: `dm-${userId}-${targetUserId}`,
        type: 'DM',
        createdById: userId,
      },
    })

    await tx.channelMember.createMany({
      data: [
        { channelId: channel.id, userId, role: 'OWNER' },
        { channelId: channel.id, userId: targetUserId, role: 'MEMBER' },
      ],
    })

    return channel
  })

  return formatChannel(dm)
}

export async function markChannelRead(channelId: string, userId: string) {
  await assertChannelMember(channelId, userId)
  await prisma.channelMember.update({
    where: { channelId_userId: { channelId, userId } },
    data: { lastReadAt: new Date() },
  })
}
