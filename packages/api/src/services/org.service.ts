import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { ErrorCodes } from '@clinikchat/shared';
import type { CreateOrgInput, UpdateOrgInput } from '@clinikchat/shared';

export async function createOrg(userId: string, input: CreateOrgInput) {
  const existing = await prisma.organization.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new AppError(409, ErrorCodes.ORG_SLUG_TAKEN, 'Organization slug is already taken');
  }

  const org = await prisma.organization.create({
    data: {
      name: input.name,
      slug: input.slug,
      ownerId: userId,
      members: {
        create: { userId, role: 'OWNER' },
      },
      channels: {
        create: {
          name: 'general',
          type: 'PUBLIC',
          topic: 'General discussion',
          createdById: userId,
          members: {
            create: { userId, role: 'OWNER' },
          },
        },
      },
    },
    include: { members: true },
  });

  return org;
}

export async function listUserOrgs(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      org: {
        select: { id: true, name: true, slug: true, ownerId: true, createdAt: true },
      },
    },
  });

  return memberships.map((m) => ({ ...m.org, role: m.role }));
}

export async function getOrg(orgId: string, userId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  if (!member) {
    throw new AppError(403, ErrorCodes.ORG_FORBIDDEN, 'You are not a member of this organization');
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { _count: { select: { members: true, channels: true } } },
  });

  if (!org) {
    throw new AppError(404, ErrorCodes.ORG_NOT_FOUND, 'Organization not found');
  }

  return org;
}

export async function updateOrg(orgId: string, userId: string, input: UpdateOrgInput) {
  const member = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
    throw new AppError(403, ErrorCodes.ORG_FORBIDDEN, 'Only owners and admins can update the organization');
  }

  return prisma.organization.update({
    where: { id: orgId },
    data: input,
  });
}

export async function inviteToOrg(orgId: string, userId: string, email: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  if (!member || member.role === 'MEMBER') {
    throw new AppError(403, ErrorCodes.ORG_FORBIDDEN, 'Only owners and admins can invite members');
  }

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) {
    throw new AppError(404, ErrorCodes.USER_NOT_FOUND, 'User with this email not found');
  }

  const existing = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: targetUser.id } },
  });
  if (existing) {
    throw new AppError(409, ErrorCodes.ORG_MEMBER_EXISTS, 'User is already a member');
  }

  await prisma.organizationMember.create({
    data: { orgId, userId: targetUser.id, role: 'MEMBER' },
  });

  const generalChannel = await prisma.channel.findFirst({
    where: { orgId, name: 'general', type: 'PUBLIC' },
  });
  if (generalChannel) {
    await prisma.channelMember.create({
      data: { channelId: generalChannel.id, userId: targetUser.id, role: 'MEMBER' },
    });
  }

  return { userId: targetUser.id, email: targetUser.email, displayName: targetUser.displayName };
}

export async function listOrgMembers(orgId: string, userId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  if (!member) {
    throw new AppError(403, ErrorCodes.ORG_FORBIDDEN, 'You are not a member of this organization');
  }

  const members = await prisma.organizationMember.findMany({
    where: { orgId },
    include: {
      user: {
        select: { id: true, email: true, displayName: true, avatarUrl: true, status: true },
      },
    },
  });

  return members.map((m) => ({ ...m.user, role: m.role, joinedAt: m.joinedAt }));
}
