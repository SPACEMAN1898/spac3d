import { randomUUID } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { prisma } from '../lib/prisma.js';
import { uploadFile, getPresignedUrl } from '../lib/storage.js';
import { AppError } from '../lib/errors.js';
import { ErrorCodes } from '@clinikchat/shared';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const THUMB_WIDTH = 300;

interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export async function uploadAttachment(
  channelId: string,
  userId: string,
  orgId: string,
  file: UploadedFile,
) {
  const member = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  if (!member) {
    throw new AppError(403, ErrorCodes.CHANNEL_FORBIDDEN, 'You are not a member of this channel');
  }

  const ext = path.extname(file.originalname) || '.bin';
  const fileId = randomUUID();
  const storageKey = `${orgId}/${channelId}/${fileId}${ext}`;

  await uploadFile(file.buffer, storageKey, file.mimetype);

  let thumbnailKey: string | null = null;
  if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
    try {
      const thumbBuffer = await sharp(file.buffer)
        .resize(THUMB_WIDTH, undefined, { fit: 'inside' })
        .toBuffer();
      thumbnailKey = `${orgId}/${channelId}/${fileId}_thumb${ext}`;
      await uploadFile(thumbBuffer, thumbnailKey, file.mimetype);
    } catch {
      // thumbnail generation failed - not critical
    }
  }

  const message = await prisma.message.create({
    data: {
      channelId,
      userId,
      content: file.originalname,
      type: 'FILE',
      attachments: {
        create: {
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storageKey,
        },
      },
    },
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true, email: true, status: true },
      },
      attachments: true,
    },
  });

  const attachment = message.attachments[0];
  const url = await getPresignedUrl(storageKey);
  const thumbnailUrl = thumbnailKey ? await getPresignedUrl(thumbnailKey) : null;

  return {
    message,
    attachment: {
      ...attachment,
      url,
      thumbnailUrl,
    },
  };
}

export async function getAttachmentUrl(attachmentId: string, userId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: {
      message: {
        include: {
          channel: {
            include: { members: { where: { userId } } },
          },
        },
      },
    },
  });

  if (!attachment) {
    throw new AppError(404, ErrorCodes.MESSAGE_NOT_FOUND, 'Attachment not found');
  }

  if (attachment.message.channel.members.length === 0) {
    throw new AppError(403, ErrorCodes.CHANNEL_FORBIDDEN, 'Access denied');
  }

  const url = await getPresignedUrl(attachment.storageKey);
  return { url, filename: attachment.filename, mimeType: attachment.mimeType };
}
