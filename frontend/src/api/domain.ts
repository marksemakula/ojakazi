import { apiClient } from './client';
import { DomainStatus } from '../types';

export async function getDomainStatus(): Promise<DomainStatus> {
  const { data } = await apiClient.get<DomainStatus>('/domain/status');
  return data;
}

export async function startVerification(method: 'dns' | 'email'): Promise<{
  message: string;
  method: string;
  txtRecord?: string;
  token?: string;
}> {
  const { data } = await apiClient.post('/domain/start', { method });
  return data;
}

export async function verifyDomain(token?: string): Promise<{ verified: boolean; message: string }> {
  const { data } = await apiClient.post('/domain/verify', token ? { token } : {});
  return data;
}
