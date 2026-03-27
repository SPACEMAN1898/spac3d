import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { sendMessageSchema, editMessageSchema } from '@clinikchat/shared';
import * as messageService from '../services/message.service.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/channels/:channelId/messages',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.channelId as string;
      const { cursor, limit, direction } = req.query;
      const result = await messageService.listMessages(channelId, req.userId!, {
        cursor: cursor as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        direction: (direction as 'before' | 'after') || undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/channels/:channelId/messages',
  validate(sendMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.channelId as string;
      const message = await messageService.sendMessage(
        channelId,
        req.userId!,
        req.body,
      );
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/messages/:messageId',
  validate(editMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageId = req.params.messageId as string;
      const message = await messageService.editMessage(
        messageId,
        req.userId!,
        req.body,
      );
      res.json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/messages/:messageId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageId = req.params.messageId as string;
      const result = await messageService.deleteMessage(messageId, req.userId!);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/channels/:channelId/read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.channelId as string;
      await messageService.markChannelRead(channelId, req.userId!);
      res.json({ success: true, data: { message: 'Channel marked as read' } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
