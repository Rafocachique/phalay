'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getAuthHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {}
      }
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { 'Authorization': `Bearer ${session.access_token}` };
  }
  return {};
}

export async function getUsers() {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers,
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
      throw new Error('Error al obtener los usuarios');
    }
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function createUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
  status?: 'ACTIVE' | 'INACTIVE';
}) {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    const resJson = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: resJson.message || 'Error al crear el usuario' };
    }

    revalidatePath('/users');
    return { 
      success: true, 
      data: resJson.data, 
      tempPassword: resJson.tempPassword 
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error de conexión con el servidor' };
  }
}

export async function updateUser(id: string, data: {
  role?: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  firstName?: string;
  lastName?: string;
}) {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    const resJson = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: resJson.message || 'Error al actualizar el usuario' };
    }

    revalidatePath('/users');
    return { success: true, data: resJson.data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error de conexión con el servidor' };
  }
}

export async function deleteUser(id: string) {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    const resJson = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: resJson.message || 'Error al eliminar el usuario' };
    }

    revalidatePath('/users');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error de conexión con el servidor' };
  }
}
