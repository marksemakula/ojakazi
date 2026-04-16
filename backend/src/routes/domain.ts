import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as OrgModel from '../models/Organization';
import * as UserModel from '../models/User';
import { authenticate, requireRole } from '../middleware/auth';
import { domainVerifyLimiter } from '../middleware/rateLimiter';
import { AuthRequest } from '../types/index';
import {
  generateSecureToken,
  hashToken,
  extractDomain,
} from '../utils/crypto';
import { checkDnsTxtRecord, buildDnsTxtValue } from '../utils/domainVerification';
import { sendVerificationEmail } from '../utils/email';
import { writeAudit } from '../utils/audit';

const router = Router();
router.use(authenticate);

const startSchema = z.object({
  method: z.enum(['dns', 'email']),
});

// GET /api/domain/status – returns org verification status
router.get('/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user!.orgId) {
      res.status(404).json({ error: 'No organization associated' });
      return;
    }
    const org = await OrgModel.findById(req.user!.orgId);
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }
    res.json({
      domain: org.domain,
      verified: org.verified,
      verifiedAt: org.verified_at,
      verificationMethod: org.verification_method,
      verificationToken: org.verification_token,
      txtRecord: org.verification_token ? buildDnsTxtValue(org.verification_token) : null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/domain/start – generate a verification token & optionally send email
router.post(
  '/start',
  requireRole('admin'),
  domainVerifyLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { method } = startSchema.parse(req.body);

      if (!req.user!.orgId) {
        res.status(400).json({ error: 'No organization associated' });
        return;
      }

      const org = await OrgModel.findById(req.user!.orgId);
      if (!org) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      if (org.verified) {
        res.status(400).json({ error: 'Domain is already verified' });
        return;
      }

      const token = generateSecureToken(20);
      await OrgModel.updateVerificationToken(org.id, token, method);

      if (method === 'email') {
        // Send to admin@domain or postmaster@domain
        const verifyAddress = `admin@${org.domain}`;
        await sendVerificationEmail(verifyAddress, org.domain, token);
        res.json({
          message: `Verification email sent to ${verifyAddress}`,
          method,
        });
      } else {
        const txtValue = buildDnsTxtValue(token);
        res.json({
          message: 'Add the following TXT record to your DNS',
          method,
          txtRecord: txtValue,
          token,
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(422).json({ error: 'Validation failed', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

// POST /api/domain/verify – attempt to confirm the token
router.post(
  '/verify',
  requireRole('admin'),
  domainVerifyLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body as { token?: string };

      if (!req.user!.orgId) {
        res.status(400).json({ error: 'No organization associated' });
        return;
      }

      const org = await OrgModel.findById(req.user!.orgId);
      if (!org) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      if (org.verified) {
        res.json({ verified: true, message: 'Already verified' });
        return;
      }

      if (!org.verification_token) {
        res.status(400).json({ error: 'No pending verification. Start verification first.' });
        return;
      }

      let success = false;

      if (org.verification_method === 'dns') {
        success = await checkDnsTxtRecord(org.domain, org.verification_token);
      } else if (org.verification_method === 'email') {
        // For email method, user submits the token they received
        if (!token) {
          res.status(400).json({ error: 'Token is required for email verification' });
          return;
        }
        success = token === org.verification_token;
      }

      if (!success) {
        res.status(400).json({
          verified: false,
          error:
            org.verification_method === 'dns'
              ? 'DNS TXT record not found. DNS changes can take up to 48 hours to propagate.'
              : 'Invalid verification token',
        });
        return;
      }

      await OrgModel.markVerified(org.id, org.verification_method!);
      await writeAudit(
        req.user!.sub,
        org.id,
        'domain.verified',
        'organization',
        org.id,
        { method: org.verification_method },
        req.ip
      );

      res.json({ verified: true, message: 'Domain verified successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
