'use server';

import { getAuthHeader } from '@/lib/auth-header';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function getConsumerClaims() {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/claims`, { headers, cache: 'no-store' });
  return response.ok ? response.json() : [];
}

export async function updateConsumerClaim(id: string, status: string, responseText: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/claims/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ status, response: responseText }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { error: error.message || 'No pudimos actualizar el registro.' };
  }
  return { success: true, data: await response.json() };
}
