import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as reactionService from '../services/reaction.service.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/messages/:messageId/reactions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageId = req.params.messageId as string;
      const { emoji } = req.body;
      if (!emoji) {
        res.status(400).json({ success: false, error: { code: 'MISSING_EMOJI', message: 'Emoji is required' } });
        return;
      }

      const { reaction, channelId } = await reactionService.addReaction(messageId, req.userId!, emoji);

      const io = req.app.get('io');
      if (io) {
        io.to(`channel:${channelId}`).emit('reaction:add', {
          messageId,
          userId: req.userId,
          emoji,
        });
      }

      res.status(201).json({ success: true, data: reaction });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/messages/:messageId/reactions/:emoji',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageId = req.params.messageId as string;
      const emoji = decodeURIComponent(req.params.emoji as string);

      const { channelId } = await reactionService.removeReaction(messageId, req.userId!, emoji);

      const io = req.app.get('io');
      if (io) {
        io.to(`channel:${channelId}`).emit('reaction:remove', {
          messageId,
          userId: req.userId,
          emoji,
        });
      }

      res.json({ success: true, data: { message: 'Reaction removed' } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
