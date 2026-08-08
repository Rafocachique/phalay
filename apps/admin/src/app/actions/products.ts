'use server';

import { revalidatePath } from 'next/cache';
import { getAuthHeader } from '@/lib/auth-header';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = formData.get('price') as string;
  const sku = formData.get('sku') as string;
  const stock = formData.get('stock') as string;
  const imagesJson = formData.get('images') as string;
  const tagsJson = formData.get('tags') as string;
  const categoryId = formData.get('categoryId') as string;
  const collectionIdsJson = formData.get('collectionIds') as string;

  if (!name || !price || !sku) {
    return { error: 'Nombre, precio y SKU son requeridos.' };
  }

  const imageUrls = imagesJson ? JSON.parse(imagesJson) : [];
  const tags = tagsJson ? JSON.parse(tagsJson) : [];
  const collectionIds = collectionIdsJson ? JSON.parse(collectionIdsJson) : [];

  const payload = {
    name,
    description: description || '',
    price: parseFloat(price),
    sku,
    stock: stock ? parseInt(stock) : 10,
    status: 'ACTIVE',
    images: imageUrls,
    tags,
    categoryId: categoryId || undefined,
    collectionIds,
  };

  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al crear el producto' };
    }
  } catch (error) {
    return { error: 'Error de conexión con la API' };
  }

  revalidatePath('/productos');
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = formData.get('price') as string;
  const sku = formData.get('sku') as string;
  const stock = formData.get('stock') as string;
  const imagesJson = formData.get('images') as string;
  const tagsJson = formData.get('tags') as string;
  const categoryId = formData.get('categoryId') as string;
  const collectionIdsJson = formData.get('collectionIds') as string;
  const variantsJson = formData.get('variants') as string;

  if (!name || !price || !sku) {
    return { error: 'Nombre, precio y SKU son requeridos.' };
  }

  const imageUrls = imagesJson ? JSON.parse(imagesJson) : [];
  const tags = tagsJson ? JSON.parse(tagsJson) : [];
  const collectionIds = collectionIdsJson ? JSON.parse(collectionIdsJson) : [];
  const variants = variantsJson ? JSON.parse(variantsJson) : undefined;

  const payload = {
    name,
    description: description || '',
    price: parseFloat(price),
    sku,
    stock: stock ? parseInt(stock) : undefined,
    images: imageUrls,
    tags,
    categoryId: categoryId || undefined,
    collectionIds,
    variants,
  };

  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al actualizar el producto' };
    }
  } catch (error) {
    return { error: 'Error de conexión con la API' };
  }

  revalidatePath('/productos');
  return { success: true };
}

export async function deleteProduct(id: string) {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al eliminar el producto' };
    }
  } catch (error) {
    return { error: 'Error de conexión con la API' };
  }

  revalidatePath('/productos');
  return { success: true };
}

export async function reorderProducts(ids: string[]) {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/products/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al reordenar' };
    }
  } catch (error) {
    return { error: 'Error de conexión con la API' };
  }

  revalidatePath('/productos');
  return { success: true };
}
