import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as StampModel from '../models/Stamp';
import { authenticate } from '../middleware/auth';
import { requireVerifiedOrg } from '../middleware/auth';
import { AuthRequest } from '../types/index';
import { writeAudit } from '../utils/audit';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate, requireVerifiedOrg, apiLimiter);

const saveSchema = z.object({
  name: z.string().min(1).max(100),
  canvasJson: z.record(z.unknown()),
  thumbnailUrl: z.string().url().optional(),
});

// List stamps for org
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stamps = await StampModel.findByOrg(req.user!.orgId!);
    res.json(stamps);
  } catch (err) {
    next(err);
  }
});

// Get single stamp
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stamp = await StampModel.findById(req.params.id, req.user!.orgId!);
    if (!stamp) {
      res.status(404).json({ error: 'Stamp not found' });
      return;
    }
    res.json(stamp);
  } catch (err) {
    next(err);
  }
});

// Create stamp
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = saveSchema.parse(req.body);
    const stamp = await StampModel.create(
      body.name,
      req.user!.orgId!,
      req.user!.sub,
      body.canvasJson,
      body.thumbnailUrl
    );
    await writeAudit(req.user!.sub, req.user!.orgId, 'stamp.create', 'stamp', stamp.id);
    res.status(201).json(stamp);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(422).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    next(err);
  }
});

// Update stamp
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = saveSchema.parse(req.body);
    const stamp = await StampModel.update(
      req.params.id,
      req.user!.orgId!,
      body.name,
      body.canvasJson,
      body.thumbnailUrl
    );
    if (!stamp) {
      res.status(404).json({ error: 'Stamp not found' });
      return;
    }
    await writeAudit(req.user!.sub, req.user!.orgId, 'stamp.update', 'stamp', stamp.id);
    res.json(stamp);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(422).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    next(err);
  }
});

// Delete (soft) stamp
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deleted = await StampModel.softDelete(req.params.id, req.user!.orgId!);
    if (!deleted) {
      res.status(404).json({ error: 'Stamp not found' });
      return;
    }
    await writeAudit(req.user!.sub, req.user!.orgId, 'stamp.delete', 'stamp', req.params.id);
    res.json({ message: 'Stamp deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
