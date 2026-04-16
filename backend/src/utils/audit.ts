import { query } from '../config/database';

export async function writeAudit(
  userId: string | null,
  orgId: string | null,
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: object,
  ipAddress?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_log (user_id, organization_id, action, resource_type, resource_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7::inet)`,
      [userId, orgId, action, resourceType ?? null, resourceId ?? null, metadata ? JSON.stringify(metadata) : null, ipAddress ?? null]
    );
  } catch (err) {
    // Audit failures must not interrupt the main request
    console.error('Audit log write failed:', err);
  }
}
