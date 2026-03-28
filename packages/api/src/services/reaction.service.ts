import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { ErrorCodes } from '@clinikchat/shared';

export async function addReaction(messageId: string, userId: string, emoji: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId }, select: { channelId: true } });
  if (!message) {
    throw new AppError(404, ErrorCodes.MESSAGE_NOT_FOUND, 'Message not found');
  }

  const member = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId: message.channelId, userId } },
  });
  if (!member) {
    throw new AppError(403, ErrorCodes.CHANNEL_FORBIDDEN, 'Not a channel member');
  }

  const existing = await prisma.reaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });
  if (existing) return { reaction: existing, channelId: message.channelId };

  const reaction = await prisma.reaction.create({
    data: { messageId, userId, emoji },
  });

  return { reaction, channelId: message.channelId };
}

export async function removeReaction(messageId: string, userId: string, emoji: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId }, select: { channelId: true } });
  if (!message) {
    throw new AppError(404, ErrorCodes.MESSAGE_NOT_FOUND, 'Message not found');
  }

  await prisma.reaction.deleteMany({
    where: { messageId, userId, emoji },
  });

  return { channelId: message.channelId };
}

export async function getReactionsForMessage(messageId: string) {
  const reactions = await prisma.reaction.findMany({
    where: { messageId },
    orderBy: { createdAt: 'asc' },
  });

  const grouped: Record<string, { emoji: string; count: number; userIds: string[] }> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
    }
    grouped[r.emoji].count++;
    grouped[r.emoji].userIds.push(r.userId);
  }

  return Object.values(grouped);
}
