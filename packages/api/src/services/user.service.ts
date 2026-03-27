import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../lib/password.js';
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

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, ErrorCodes.USER_NOT_FOUND, 'User not found');
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(400, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'Current password is incorrect');
  }

  if (newPassword.length < 8) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'New password must be at least 8 characters');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
