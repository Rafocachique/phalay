'use server';

import { revalidatePath } from 'next/cache';
import { getAuthHeader } from '@/lib/auth-header';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * Confirma o rechaza el pago de un pedido después de revisar la captura
 * que la clienta envió por WhatsApp.
 */
export async function reviewOrderPayment(orderId: string, approved: boolean) {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ approved }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || 'No se pudo actualizar el pago' };
    }
  } catch (error) {
    return { error: 'Error de conexión' };
  }

  revalidatePath('/orders');
  return { success: true };
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || 'Error al actualizar el estado' };
    }
  } catch (error) {
    return { error: 'Error de conexión' };
  }

  revalidatePath('/orders');
  revalidatePath('/');
  return { success: true };
}

export async function deleteOrder(orderId: string) {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || 'Error al eliminar el pedido' };
    }
  } catch (error) {
    return { error: 'Error de conexión' };
  }

  revalidatePath('/orders');
  revalidatePath('/');
  return { success: true };
}
