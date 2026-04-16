import { query, queryOne } from '../config/database';
import { Stamp } from '../types/index';

export async function findByOrg(orgId: string): Promise<Stamp[]> {
  return query<Stamp>(
    'SELECT * FROM stamps WHERE organization_id = $1 AND is_active = TRUE ORDER BY created_at DESC',
    [orgId]
  );
}

export async function findById(id: string, orgId: string): Promise<Stamp | null> {
  return queryOne<Stamp>(
    'SELECT * FROM stamps WHERE id = $1 AND organization_id = $2',
    [id, orgId]
  );
}

export async function create(
  name: string,
  orgId: string,
  userId: string,
  canvasJson: object,
  thumbnailUrl?: string
): Promise<Stamp> {
  const result = await queryOne<Stamp>(
    `INSERT INTO stamps (name, organization_id, created_by, canvas_json, thumbnail_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, orgId, userId, JSON.stringify(canvasJson), thumbnailUrl ?? null]
  );
  return result!;
}

export async function update(
  id: string,
  orgId: string,
  name: string,
  canvasJson: object,
  thumbnailUrl?: string
): Promise<Stamp | null> {
  return queryOne<Stamp>(
    `UPDATE stamps
     SET name = $3, canvas_json = $4, thumbnail_url = $5
     WHERE id = $1 AND organization_id = $2 RETURNING *`,
    [id, orgId, name, JSON.stringify(canvasJson), thumbnailUrl ?? null]
  );
}

export async function softDelete(id: string, orgId: string): Promise<boolean> {
  const result = await queryOne<{ id: string }>(
    `UPDATE stamps SET is_active = FALSE WHERE id = $1 AND organization_id = $2 RETURNING id`,
    [id, orgId]
  );
  return result !== null;
}
