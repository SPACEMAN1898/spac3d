import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as fileService from '../services/file.service.js';
import { prisma } from '../lib/prisma.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = Router();

router.use(authMiddleware);

router.post(
  '/channels/:channelId/upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.channelId as string;
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
        return;
      }

      const channel = await prisma.channel.findUnique({ where: { id: channelId }, select: { orgId: true } });
      if (!channel) {
        res.status(404).json({ success: false, error: { code: 'CHANNEL_NOT_FOUND', message: 'Channel not found' } });
        return;
      }

      const result = await fileService.uploadAttachment(
        channelId,
        req.userId!,
        channel.orgId,
        {
          originalname: file.originalname,
          mimetype: file.mimetype,
          buffer: file.buffer,
          size: file.size,
        },
      );

      const io = req.app.get('io');
      if (io) {
        io.to(`channel:${channelId}`).emit('message:new', {
          ...result.message,
          attachments: [result.attachment],
        });
      }

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/attachments/:attachmentId/url',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attachmentId = req.params.attachmentId as string;
      const result = await fileService.getAttachmentUrl(attachmentId, req.userId!);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
