'use server';

import { getAuthHeader } from '@/lib/auth-header';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export async function createCollection(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const imageUrl = formData.get('imageUrl') as string;

  if (!name) {
    return { error: 'El nombre es requerido.' };
  }

  const payload: any = { name };
  if (description) payload.description = description;
  if (imageUrl) payload.imageUrl = imageUrl;

  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al crear la colección' };
    }
  } catch (error) {
    console.error('SERVER ACTION ERROR (createCollection):', error);
    return { error: 'Error de conexión con la API' };
  }

  return { success: true };
}

export async function updateCollection(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const imageUrl = formData.get('imageUrl') as string;

  if (!name) {
    return { error: 'El nombre es requerido.' };
  }

  const payload: any = { name };
  if (description) payload.description = description;
  if (imageUrl) payload.imageUrl = imageUrl;

  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al actualizar la colección' };
    }
  } catch (error) {
    return { error: 'Error de conexión con la API' };
  }

  return { success: true };
}

export async function deleteCollection(id: string) {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al eliminar la colección' };
    }
    
    return { success: true };
  } catch (error) {
    return { error: 'Error de conexión con la API' };
  }
}

export async function reorderCollections(ids: string[]) {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/collections/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al reordenar' };
    }
    return { success: true };
  } catch (error) {
    return { error: 'Error de conexión con la API' };
  }
}
