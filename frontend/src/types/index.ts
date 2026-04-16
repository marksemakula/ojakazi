// ── Auth ─────────────────────────────────────────────────────────────────────
export interface TokenPayload {
  sub: string;
  email: string;
  orgId: string | null;
  role: 'admin' | 'member';
  orgVerified: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  organization_id: string | null;
  email_verified: boolean;
  created_at: string;
}

// ── Organization ──────────────────────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  domain: string;
  verified: boolean;
  verified_at: string | null;
  verification_method: 'dns' | 'email' | null;
}

export interface DomainStatus {
  domain: string;
  verified: boolean;
  verifiedAt: string | null;
  verificationMethod: 'dns' | 'email' | null;
  verificationToken: string | null;
  txtRecord: string | null;
}

// ── Stamp ─────────────────────────────────────────────────────────────────────
export interface Stamp {
  id: string;
  name: string;
  organization_id: string;
  created_by: string;
  canvas_json: object;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Signature ─────────────────────────────────────────────────────────────────
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export type DocumentType = 'pdf' | 'image';

export interface SignaturePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}
