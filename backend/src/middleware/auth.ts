import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { AuthRequest, TokenPayload } from '../types/index';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(role: 'admin' | 'member') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    if (role === 'admin' && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  };
}

export function requireVerifiedOrg(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }
  if (!req.user.orgId) {
    res.status(403).json({ error: 'Organization membership required' });
    return;
  }
  if (!req.user.orgVerified) {
    res.status(403).json({
      error: 'Organization domain not verified. Please complete domain verification.',
    });
    return;
  }
  next();
}
