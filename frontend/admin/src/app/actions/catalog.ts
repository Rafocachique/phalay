'use server';

import { revalidatePath } from 'next/cache';
import { getAuthHeader } from '@/lib/auth-header';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function createCatalogo(formData: FormData) {
  try {
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      imageUrl: formData.get('imageUrl'),
    };

    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) throw new Error('Error al crear el tipo de prenda');
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Ocurrió un error inesperado' };
  }
}

export async function updateCatalogo(id: string, formData: FormData) {
  try {
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      imageUrl: formData.get('imageUrl'),
    };
    
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Error al actualizar el tipo de prenda');
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Ocurrió un error inesperado' };
  }
}

export async function deleteCatalogo(id: string) {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || 'Error al eliminar el catálogo' };
    }
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { error: 'Error de conexión con la API' };
  }
}

export async function reorderCatalogo(ids: string[]) {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/categories/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Error al reordenar');
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Ocurrió un error inesperado' };
  }
}
