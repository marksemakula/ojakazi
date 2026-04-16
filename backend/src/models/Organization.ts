import { query, queryOne } from '../config/database';
import { Organization } from '../types/index';

export async function findByDomain(domain: string): Promise<Organization | null> {
  return queryOne<Organization>('SELECT * FROM organizations WHERE domain = $1', [domain]);
}

export async function findById(id: string): Promise<Organization | null> {
  return queryOne<Organization>('SELECT * FROM organizations WHERE id = $1', [id]);
}

export async function create(
  name: string,
  domain: string,
  token: string,
  method: 'dns' | 'email'
): Promise<Organization> {
  const result = await queryOne<Organization>(
    `INSERT INTO organizations (name, domain, verification_token, verification_method)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, domain, token, method]
  );
  return result!;
}

export async function markVerified(id: string, method: 'dns' | 'email'): Promise<Organization> {
  const result = await queryOne<Organization>(
    `UPDATE organizations
     SET verified = TRUE, verified_at = NOW(), verification_method = $2
     WHERE id = $1 RETURNING *`,
    [id, method]
  );
  return result!;
}

export async function updateVerificationToken(
  id: string,
  token: string,
  method: 'dns' | 'email'
): Promise<void> {
  await query(
    `UPDATE organizations SET verification_token = $2, verification_method = $3 WHERE id = $1`,
    [id, token, method]
  );
}
