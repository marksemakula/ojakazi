import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function extractDomain(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[1]) throw new Error('Invalid email');
  return parts[1].toLowerCase();
}
