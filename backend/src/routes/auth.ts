import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as UserModel from '../models/User';
import * as OrgModel from '../models/Organization';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/jwt';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  extractDomain,
} from '../utils/crypto';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { AuthRequest } from '../types/index';
import { writeAudit } from '../utils/audit';

const router = Router();

// ── Schemas ─────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildRefreshExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

function safeUser(user: Awaited<ReturnType<typeof UserModel.findById>>) {
  if (!user) return null;
  const { password_hash: _, ...rest } = user;
  return rest;
}

// ── Routes ───────────────────────────────────────────────────────────────────
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerSchema.parse(req.body);
    const domain = extractDomain(body.email);

    const existing = await UserModel.findByEmail(body.email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await hashPassword(body.password);

    // Find or note domain for org association
    let org = await OrgModel.findByDomain(domain);
    const isFirstForDomain = !org;
    const role: 'admin' | 'member' = isFirstForDomain ? 'admin' : 'member';

    if (isFirstForDomain) {
      const token = generateSecureToken();
      org = await OrgModel.create(
        `${domain.charAt(0).toUpperCase() + domain.slice(1)} Organization`,
        domain,
        token,
        'dns'
      );
    }

    const user = await UserModel.create(body.email, passwordHash, body.name, org!.id, role);

    await writeAudit(user.id, org!.id, 'user.register', 'user', user.id, { role }, req.ip);

    res.status(201).json({ message: 'Account created. Please verify your organization domain.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(422).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    next(err);
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await UserModel.findByEmail(body.email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await verifyPassword(body.password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    let orgVerified = false;
    if (user.organization_id) {
      const org = await OrgModel.findById(user.organization_id);
      orgVerified = org?.verified ?? false;
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      orgId: user.organization_id,
      role: user.role,
      orgVerified,
    });

    const rawRefresh = generateSecureToken();
    const hashed = hashToken(rawRefresh);
    await UserModel.storeRefreshToken(user.id, hashed, buildRefreshExpiry());

    await writeAudit(user.id, user.organization_id, 'user.login', 'user', user.id, {}, req.ip);

    res.json({
      accessToken,
      refreshToken: rawRefresh,
      user: safeUser(user),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(422).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    next(err);
  }
});

router.post('/refresh', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Missing refresh token' });
      return;
    }

    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const hashed = hashToken(refreshToken);
    const stored = await UserModel.findValidRefreshToken(payload.sub, hashed);
    if (!stored) {
      res.status(401).json({ error: 'Refresh token not found or expired' });
      return;
    }

    const user = await UserModel.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    let orgVerified = false;
    if (user.organization_id) {
      const org = await OrgModel.findById(user.organization_id);
      orgVerified = org?.verified ?? false;
    }

    // Rotate refresh token
    await UserModel.revokeRefreshToken(hashed);
    const newRaw = generateSecureToken();
    const newHashed = hashToken(newRaw);
    await UserModel.storeRefreshToken(user.id, newHashed, buildRefreshExpiry());

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      orgId: user.organization_id,
      role: user.role,
      orgVerified,
    });

    res.json({ accessToken, refreshToken: newRaw });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const hashed = hashToken(refreshToken);
      await UserModel.revokeRefreshToken(hashed);
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findById(req.user!.sub);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(safeUser(user));
  } catch (err) {
    next(err);
  }
});

export default router;
