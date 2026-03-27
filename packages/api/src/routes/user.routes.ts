import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as userService from '../services/user.service.js';

const router = Router();

router.use(authMiddleware);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getCurrentUser(req.userId!);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const user = await userService.updateCurrentUser(req.userId!, { displayName, avatarUrl });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
