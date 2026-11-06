'use server';

import { getAuthHeader } from '@/lib/auth-header';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// ── Agencias de transporte ──

export async function getAgencies() {
  const res = await fetch(`${API_BASE_URL}/shipping/agencies`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function createAgency(data: { name: string; trackingUrl?: string; contactPhone?: string }) {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/shipping/agencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || 'Error al crear la agencia' };
  }
  return { success: true, data: await res.json() };
}

export async function updateAgency(id: string, data: any) {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/shipping/agencies/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || 'Error al actualizar la agencia' };
  }
  return { success: true };
}

export async function deleteAgency(id: string) {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/shipping/agencies/${id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || 'Error al eliminar la agencia' };
  }
  return { success: true };
}

export async function getDestinations() {
  const res = await fetch(`${API_BASE_URL}/shipping/destinations`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function getShippingRequests() {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/shipping/requests`, { headers: authHeaders, cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function saveDestination(editingId: string | null, data: any) {
  const authHeaders = await getAuthHeader();
  const method = editingId ? 'PATCH' : 'POST';
  const url = editingId
    ? `${API_BASE_URL}/shipping/destinations/${editingId}`
    : `${API_BASE_URL}/shipping/destinations`;

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || 'Error al guardar el destino' };
  }
  return { success: true };
}

export async function deleteDestination(id: string) {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/shipping/destinations/${id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || 'Error al eliminar el destino' };
  }
  return { success: true };
}

/**
 * Crea el destino que la clienta no encontró y resuelve la solicitud: el
 * destino queda disponible en el checkout y el pedido pendiente recibe su
 * costo de envío real.
 */
export async function resolveRequestWithNewDestination(requestId: string, data: any) {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/shipping/requests/${requestId}/destination`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || 'Error al configurar el destino' };
  }
  return { success: true };
}

export async function resolveShippingRequest(id: string, destinationId?: string) {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/shipping/requests/${id}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ destinationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || 'Error al resolver la solicitud' };
  }
  return { success: true };
}
