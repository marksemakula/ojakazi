import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index';

/**
 * Ensures the resource being accessed belongs to the same org as the requester.
 * Reads orgId from req.params or req.body and compares to req.user.orgId.
 */
export function scopeToOrg(paramName = 'orgId') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const requestedOrgId = req.params[paramName] ?? req.body[paramName];
    if (requestedOrgId && req.user?.orgId !== requestedOrgId) {
      res.status(403).json({ error: 'Access denied: resource belongs to another organization' });
      return;
    }
    next();
  };
}
