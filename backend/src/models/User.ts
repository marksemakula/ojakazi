import { query, queryOne } from '../config/database';
import { User } from '../types/index';

export async function findByEmail(email: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
}

export async function findById(id: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
}

export async function findByOrgId(orgId: string): Promise<User[]> {
  return query<User>('SELECT * FROM users WHERE organization_id = $1 ORDER BY created_at', [orgId]);
}

export async function create(
  email: string,
  passwordHash: string,
  name: string,
  orgId: string | null,
  role: 'admin' | 'member' = 'member'
): Promise<User> {
  const result = await queryOne<User>(
    `INSERT INTO users (email, password_hash, name, organization_id, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [email.toLowerCase(), passwordHash, name, orgId, role]
  );
  return result!;
}

export async function setEmailVerified(id: string): Promise<void> {
  await query('UPDATE users SET email_verified = TRUE WHERE id = $1', [id]);
}

export async function updateOrg(
  userId: string,
  orgId: string,
  role: 'admin' | 'member'
): Promise<void> {
  await query('UPDATE users SET organization_id = $2, role = $3 WHERE id = $1', [
    userId,
    orgId,
    role,
  ]);
}

export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
}

export async function findValidRefreshToken(
  userId: string,
  tokenHash: string
): Promise<{ id: string } | null> {
  return queryOne<{ id: string }>(
    `SELECT id FROM refresh_tokens
     WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()`,
    [userId, tokenHash]
  );
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}
