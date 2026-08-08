'use server';

import { getAuthHeader } from '@/lib/auth-header';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function getFaqs() {
  const res = await fetch(`${API_BASE_URL}/stores/faqs`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function createFaq(data: { question: string; answer: string }) {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/stores/faqs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || 'Error al añadir la pregunta' };
  }
  return { success: true, data: await res.json() };
}

export async function deleteFaq(id: string) {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/stores/faqs/${id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || 'Error al eliminar la pregunta' };
  }
  return { success: true };
}
