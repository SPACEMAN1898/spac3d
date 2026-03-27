import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { ErrorCodes } from '@clinikchat/shared';

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      status: true,
      lastSeenAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, ErrorCodes.USER_NOT_FOUND, 'User not found');
  }

  return user;
}

export async function updateCurrentUser(
  userId: string,
  data: { displayName?: string; avatarUrl?: string },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      status: true,
      lastSeenAt: true,
    },
  });

  return user;
}
