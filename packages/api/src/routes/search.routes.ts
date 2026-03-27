import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as searchService from '../services/search.service.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/channels/:channelId/search',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.channelId as string;
      const q = (req.query.q as string) || '';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const results = await searchService.searchMessages(channelId, req.userId!, q, limit);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
