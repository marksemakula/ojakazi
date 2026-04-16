-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(255) NOT NULL,
  domain               VARCHAR(255) UNIQUE NOT NULL,
  verified             BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at          TIMESTAMPTZ,
  verification_method  VARCHAR(20) CHECK (verification_method IN ('dns', 'email')),
  verification_token   VARCHAR(255),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  role              VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  organization_id   UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stamps
CREATE TABLE IF NOT EXISTS stamps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255) NOT NULL,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  canvas_json      JSONB NOT NULL,
  thumbnail_url    TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  action           VARCHAR(100) NOT NULL,
  resource_type    VARCHAR(50),
  resource_id      UUID,
  metadata         JSONB,
  ip_address       INET,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_org        ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_stamps_org       ON stamps(organization_id);
CREATE INDEX IF NOT EXISTS idx_stamps_active    ON stamps(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens   ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user       ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_org        ON audit_log(organization_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_organizations_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_stamps_updated
  BEFORE UPDATE ON stamps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
