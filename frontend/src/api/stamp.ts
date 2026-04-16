import { apiClient } from './client';
import { Stamp } from '../types';

export async function listStamps(): Promise<Stamp[]> {
  const { data } = await apiClient.get<Stamp[]>('/stamp');
  return data;
}

export async function getStamp(id: string): Promise<Stamp> {
  const { data } = await apiClient.get<Stamp>(`/stamp/${id}`);
  return data;
}

export async function createStamp(
  name: string,
  canvasJson: object,
  thumbnailUrl?: string
): Promise<Stamp> {
  const { data } = await apiClient.post<Stamp>('/stamp', { name, canvasJson, thumbnailUrl });
  return data;
}

export async function updateStamp(
  id: string,
  name: string,
  canvasJson: object,
  thumbnailUrl?: string
): Promise<Stamp> {
  const { data } = await apiClient.put<Stamp>(`/stamp/${id}`, { name, canvasJson, thumbnailUrl });
  return data;
}

export async function deleteStamp(id: string): Promise<void> {
  await apiClient.delete(`/stamp/${id}`);
}
