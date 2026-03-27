import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createOrgSchema, updateOrgSchema, inviteToOrgSchema } from '@clinikchat/shared';
import * as orgService from '../services/org.service.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  validate(createOrgSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const org = await orgService.createOrg(req.userId!, req.body);
      res.status(201).json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await orgService.listUserOrgs(req.userId!);
    res.json({ success: true, data: orgs });
  } catch (err) {
    next(err);
  }
});

router.get('/:orgId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.params.orgId as string;
    const org = await orgService.getOrg(orgId, req.userId!);
    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:orgId',
  validate(updateOrgSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.params.orgId as string;
      const org = await orgService.updateOrg(orgId, req.userId!, req.body);
      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:orgId/invite',
  validate(inviteToOrgSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.params.orgId as string;
      const result = await orgService.inviteToOrg(orgId, req.userId!, req.body.email);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/:orgId/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.params.orgId as string;
    const members = await orgService.listOrgMembers(orgId, req.userId!);
    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
});

export default router;
