import { Router, Response, NextFunction } from 'express';
import * as UserModel from '../models/User';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/index';

const router = Router();
router.use(authenticate);

// List org members (admin only)
router.get(
  '/org/members',
  requireRole('admin'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.orgId) {
        res.status(400).json({ error: 'No organization' });
        return;
      }
      const users = await UserModel.findByOrgId(req.user!.orgId);
      const sanitized = users.map(({ password_hash: _, ...rest }) => rest);
      res.json(sanitized);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
