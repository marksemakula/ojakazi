import { Stamp } from '../types';

const STORAGE_KEY = 'ojakazi-local-stamps';

function getAll(): Stamp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(stamps: Stamp[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stamps));
}

export function listLocalStamps(): Stamp[] {
  return getAll().filter((s) => s.is_active);
}

export function createLocalStamp(
  name: string,
  canvasJson: object,
  thumbnailUrl?: string
): Stamp {
  const now = new Date().toISOString();
  const stamp: Stamp = {
    id: crypto.randomUUID(),
    name,
    organization_id: '',
    created_by: '',
    canvas_json: canvasJson,
    thumbnail_url: thumbnailUrl ?? null,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
  saveAll([stamp, ...getAll()]);
  return stamp;
}

export function updateLocalStamp(
  id: string,
  name: string,
  canvasJson: object,
  thumbnailUrl?: string
): Stamp | null {
  const all = getAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated: Stamp = {
    ...all[idx],
    name,
    canvas_json: canvasJson,
    thumbnail_url: thumbnailUrl ?? null,
    updated_at: new Date().toISOString(),
  };
  all[idx] = updated;
  saveAll(all);
  return updated;
}

export function deleteLocalStamp(id: string): void {
  const all = getAll().map((s) =>
    s.id === id ? { ...s, is_active: false } : s
  );
  saveAll(all);
}
