import { Request } from 'express';

export interface TokenPayload {
  sub: string;        // userId
  email: string;
  orgId: string | null;
  role: 'admin' | 'member';
  orgVerified: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  verified: boolean;
  verified_at: Date | null;
  verification_method: 'dns' | 'email' | null;
  verification_token: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'member';
  organization_id: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Stamp {
  id: string;
  name: string;
  organization_id: string;
  created_by: string;
  canvas_json: object;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ApiError extends Error {
  statusCode: number;
  code?: string;
}

export type VerificationMethod = 'dns' | 'email';
