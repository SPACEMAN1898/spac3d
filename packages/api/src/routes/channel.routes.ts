import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createChannelSchema, updateChannelSchema, createDmSchema } from '@clinikchat/shared';
import * as channelService from '../services/channel.service.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/orgs/:orgId/channels',
  validate(createChannelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.params.orgId as string;
      const channel = await channelService.createChannel(orgId, req.userId!, req.body);
      res.status(201).json({ success: true, data: channel });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/orgs/:orgId/channels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.params.orgId as string;
    const channels = await channelService.listChannels(orgId, req.userId!);
    res.json({ success: true, data: channels });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/orgs/:orgId/dm',
  validate(createDmSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.params.orgId as string;
      const channel = await channelService.createOrGetDm(
        orgId,
        req.userId!,
        req.body.targetUserId,
      );
      res.json({ success: true, data: channel });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/channels/:channelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channelId = req.params.channelId as string;
    const channel = await channelService.getChannel(channelId, req.userId!);
    res.json({ success: true, data: channel });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/channels/:channelId',
  validate(updateChannelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.channelId as string;
      const channel = await channelService.updateChannel(
        channelId,
        req.userId!,
        req.body,
      );
      res.json({ success: true, data: channel });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/channels/:channelId/members',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.channelId as string;
      const result = await channelService.addChannelMember(
        channelId,
        req.userId!,
        req.body.userId,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/channels/:channelId/members/:userId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.channelId as string;
      const targetUserId = req.params.userId as string;
      await channelService.removeChannelMember(
        channelId,
        req.userId!,
        targetUserId,
      );
      res.json({ success: true, data: { message: 'Member removed' } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
