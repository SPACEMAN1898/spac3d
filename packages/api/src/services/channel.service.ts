import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { ErrorCodes } from '@clinikchat/shared';
import type { CreateChannelInput, UpdateChannelInput } from '@clinikchat/shared';

async function assertOrgMember(orgId: string, userId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  if (!member) {
    throw new AppError(403, ErrorCodes.ORG_FORBIDDEN, 'You are not a member of this organization');
  }
  return member;
}

export async function createChannel(orgId: string, userId: string, input: CreateChannelInput) {
  await assertOrgMember(orgId, userId);

  const channel = await prisma.channel.create({
    data: {
      orgId,
      name: input.name,
      type: input.type,
      topic: input.topic,
      createdById: userId,
      members: {
        create: { userId, role: 'OWNER' },
      },
    },
  });

  return channel;
}

export async function listChannels(orgId: string, userId: string) {
  await assertOrgMember(orgId, userId);

  const channels = await prisma.channel.findMany({
    where: {
      orgId,
      OR: [
        { type: 'PUBLIC' },
        { members: { some: { userId } } },
      ],
    },
    include: {
      _count: { select: { members: true, messages: true } },
      members: {
        where: { userId },
        select: { lastReadAt: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return channels.map((ch) => {
    const myMembership = ch.members[0];
    return {
      id: ch.id,
      orgId: ch.orgId,
      name: ch.name,
      topic: ch.topic,
      type: ch.type,
      createdById: ch.createdById,
      createdAt: ch.createdAt.toISOString(),
      updatedAt: ch.updatedAt.toISOString(),
      memberCount: ch._count.members,
      messageCount: ch._count.messages,
      lastReadAt: myMembership?.lastReadAt?.toISOString() ?? null,
    };
  });
}

export async function getChannel(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true, status: true, email: true },
          },
        },
      },
    },
  });

  if (!channel) {
    throw new AppError(404, ErrorCodes.CHANNEL_NOT_FOUND, 'Channel not found');
  }

  const isMember = channel.members.some((m) => m.userId === userId);
  if (!isMember && channel.type !== 'PUBLIC') {
    throw new AppError(403, ErrorCodes.CHANNEL_FORBIDDEN, 'You do not have access to this channel');
  }

  return channel;
}

export async function updateChannel(channelId: string, userId: string, input: UpdateChannelInput) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { members: { where: { userId } } },
  });

  if (!channel) {
    throw new AppError(404, ErrorCodes.CHANNEL_NOT_FOUND, 'Channel not found');
  }

  const membership = channel.members[0];
  if (!membership) {
    throw new AppError(403, ErrorCodes.CHANNEL_FORBIDDEN, 'You are not a member of this channel');
  }

  return prisma.channel.update({
    where: { id: channelId },
    data: input,
  });
}

export async function addChannelMember(channelId: string, userId: string, targetUserId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { members: { where: { userId } } },
  });

  if (!channel) {
    throw new AppError(404, ErrorCodes.CHANNEL_NOT_FOUND, 'Channel not found');
  }

  if (!channel.members[0]) {
    throw new AppError(403, ErrorCodes.CHANNEL_FORBIDDEN, 'You are not a member of this channel');
  }

  const existing = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId: targetUserId } },
  });
  if (existing) {
    throw new AppError(409, ErrorCodes.CHANNEL_MEMBER_EXISTS, 'User is already a member');
  }

  await prisma.channelMember.create({
    data: { channelId, userId: targetUserId, role: 'MEMBER' },
  });

  return { channelId, userId: targetUserId };
}

export async function removeChannelMember(channelId: string, userId: string, targetUserId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { members: { where: { userId } } },
  });

  if (!channel) {
    throw new AppError(404, ErrorCodes.CHANNEL_NOT_FOUND, 'Channel not found');
  }

  const membership = channel.members[0];
  if (!membership || (membership.role === 'MEMBER' && userId !== targetUserId)) {
    throw new AppError(403, ErrorCodes.CHANNEL_FORBIDDEN, 'Insufficient permissions');
  }

  await prisma.channelMember.delete({
    where: { channelId_userId: { channelId, userId: targetUserId } },
  });
}

export async function createOrGetDm(orgId: string, userId: string, targetUserId: string) {
  await assertOrgMember(orgId, userId);

  const existingDm = await prisma.channel.findFirst({
    where: {
      orgId,
      type: 'DM',
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
  });

  if (existingDm) return existingDm;

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { displayName: true },
  });

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  });

  const channel = await prisma.channel.create({
    data: {
      orgId,
      name: `${currentUser?.displayName ?? 'User'}, ${targetUser?.displayName ?? 'User'}`,
      type: 'DM',
      createdById: userId,
      members: {
        createMany: {
          data: [
            { userId, role: 'MEMBER' },
            { userId: targetUserId, role: 'MEMBER' },
          ],
        },
      },
    },
  });

  return channel;
}
