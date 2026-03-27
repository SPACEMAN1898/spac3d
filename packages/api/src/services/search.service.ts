import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { ErrorCodes } from '@clinikchat/shared';

export async function searchMessages(
  channelId: string,
  userId: string,
  query: string,
  limit = 20,
) {
  const member = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  if (!member) {
    throw new AppError(403, ErrorCodes.CHANNEL_FORBIDDEN, 'You are not a member of this channel');
  }

  if (!query.trim()) {
    return [];
  }

  const sanitizedQuery = query.replace(/[^\w\s]/g, ' ').trim().split(/\s+/).join(' & ');

  const messages = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      content: string;
      created_at: Date;
      user_id: string;
      display_name: string;
      avatar_url: string | null;
    }>
  >(
    `SELECT m.id, m.content, m.created_at, m.user_id, u.display_name, u.avatar_url
     FROM messages m
     JOIN users u ON u.id = m.user_id
     WHERE m.channel_id = $1::uuid
       AND to_tsvector('english', m.content) @@ to_tsquery('english', $2)
     ORDER BY m.created_at DESC
     LIMIT $3`,
    channelId,
    sanitizedQuery || query,
    limit,
  );

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.created_at,
    userId: m.user_id,
    user: {
      id: m.user_id,
      displayName: m.display_name,
      avatarUrl: m.avatar_url,
    },
  }));
}
