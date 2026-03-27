import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as userService from '../services/user.service.js';
import { uploadFile, getPresignedUrl } from '../lib/storage.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

router.post(
  '/me/avatar',
  upload.single('avatar'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
        return;
      }

      const ext = path.extname(file.originalname) || '.jpg';
      const key = `avatars/${req.userId}/${randomUUID()}${ext}`;
      await uploadFile(file.buffer, key, file.mimetype);
      const url = await getPresignedUrl(key, 86400 * 30);

      const user = await userService.updateCurrentUser(req.userId!, { avatarUrl: url });
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
);

router.post('/me/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.userId!, currentPassword, newPassword);
    res.json({ success: true, data: { message: 'Password changed' } });
  } catch (err) {
    next(err);
  }
});

export default router;
