import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { ErrorCodes } from '@clinikchat/shared';
import type { SendMessageInput, EditMessageInput } from '@clinikchat/shared';

async function assertChannelMember(channelId: string, userId: string) {
  const member = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  if (!member) {
    throw new AppError(403, ErrorCodes.CHANNEL_FORBIDDEN, 'You are not a member of this channel');
  }
  return member;
}

export async function listMessages(
  channelId: string,
  userId: string,
  options: { cursor?: string; limit?: number; direction?: 'before' | 'after' },
) {
  await assertChannelMember(channelId, userId);

  const limit = Math.min(options.limit ?? 50, 100);
  const direction = options.direction ?? 'before';

  let cursorDate: Date | undefined;
  if (options.cursor) {
    const cursorMsg = await prisma.message.findUnique({ where: { id: options.cursor } });
    if (cursorMsg) cursorDate = cursorMsg.createdAt;
  }

  const messages = await prisma.message.findMany({
    where: {
      channelId,
      ...(cursorDate && {
        createdAt: direction === 'before' ? { lt: cursorDate } : { gt: cursorDate },
      }),
    },
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true, email: true, status: true },
      },
      attachments: true,
    },
    orderBy: { createdAt: direction === 'before' ? 'desc' : 'asc' },
    take: limit + 1,
  });

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  if (direction === 'before') messages.reverse();

  return {
    items: messages,
    hasMore,
    nextCursor: hasMore ? messages[messages.length - 1]?.id ?? null : null,
    prevCursor: messages[0]?.id ?? null,
  };
}

export async function sendMessage(channelId: string, userId: string, input: SendMessageInput) {
  await assertChannelMember(channelId, userId);

  const message = await prisma.message.create({
    data: {
      channelId,
      userId,
      content: input.content,
      type: 'TEXT',
      parentId: input.parentId,
    },
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true, email: true, status: true },
      },
      attachments: true,
    },
  });

  return message;
}

export async function editMessage(messageId: string, userId: string, input: EditMessageInput) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message) {
    throw new AppError(404, ErrorCodes.MESSAGE_NOT_FOUND, 'Message not found');
  }

  if (message.userId !== userId) {
    throw new AppError(403, ErrorCodes.MESSAGE_FORBIDDEN, 'You can only edit your own messages');
  }

  return prisma.message.update({
    where: { id: messageId },
    data: {
      content: input.content,
      editedAt: new Date(),
    },
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true, email: true, status: true },
      },
      attachments: true,
    },
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: { include: { members: { where: { userId } } } } },
  });

  if (!message) {
    throw new AppError(404, ErrorCodes.MESSAGE_NOT_FOUND, 'Message not found');
  }

  const isOwner = message.userId === userId;
  const isChannelAdmin = message.channel.members[0]?.role === 'ADMIN' || message.channel.members[0]?.role === 'OWNER';

  if (!isOwner && !isChannelAdmin) {
    throw new AppError(403, ErrorCodes.MESSAGE_FORBIDDEN, 'Insufficient permissions to delete this message');
  }

  await prisma.message.delete({ where: { id: messageId } });
  return { channelId: message.channelId };
}

export async function markChannelRead(channelId: string, userId: string) {
  await prisma.channelMember.update({
    where: { channelId_userId: { channelId, userId } },
    data: { lastReadAt: new Date() },
  });
}
