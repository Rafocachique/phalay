'use server';

import { getAuthHeader } from '@/lib/auth-header';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function updateStoreAppearance(formData: FormData) {
  const bannerUrl = formData.get('bannerUrl') as string;
  const title = formData.get('title') as string;
  const subtitle = formData.get('subtitle') as string;

  const payload = {
    bannerUrl,
    branding: {
      heroTitle: title,
      heroSubtitle: subtitle
    }
  };

  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/stores`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al actualizar el banner' };
    }
    
    return { success: true };
  } catch (error) {
    return { error: 'Error de conexión con la API' };
  }
}

export async function getStoreSettings() {
  try {
    // El panel usa el endpoint con auth: el público oculta datos internos.
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/stores/admin`, { headers: authHeaders, cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getPaymentGatewayStatus() {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/stores/payment-gateway/status`, { headers: authHeaders, cache: 'no-store' });
    if (!response.ok) return { error: 'No se pudo leer el estado de la pasarela.' };
    return response.json();
  } catch {
    return { error: 'No se pudo conectar con la pasarela.' };
  }
}

export async function updatePaymentSettings(data: {
  paymentCardEnabled?: boolean;
  paymentYapeEnabled?: boolean;
  paymentManualEnabled?: boolean;
  yapeNumber?: string;
  yapeQrUrl?: string;
  manualPaymentInfo?: string;
}) {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/stores`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al guardar la configuración de pagos' };
    }

    return { success: true };
  } catch (error) {
    return { error: 'Error de conexión con la API' };
  }
}

export async function updateStoreSettings(data: {
  storeName: string;
  storeDescription: string;
  legalName: string;
  businessRuc: string;
  businessAddress: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: { instagram: string; facebook: string; whatsapp: string };
}) {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/stores`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Error al guardar la configuración' };
    }

    return { success: true };
  } catch (error) {
    return { error: 'Error de conexión con la API' };
  }
}
