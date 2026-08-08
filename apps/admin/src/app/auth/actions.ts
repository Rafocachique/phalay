'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

function translateAuthError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('email logins are disabled') || msg.includes('email login is disabled')) {
    return 'El inicio de sesión con correo electrónico está deshabilitado en tu proyecto de Supabase. Para solucionarlo, ve a la sección Authentication -> Providers -> Email en tu Dashboard de Supabase y activa la opción "Enable Email provider".';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'El correo electrónico o la contraseña son incorrectos.';
  }
  if (msg.includes('email not confirmed') || msg.includes('confirm your email') || msg.includes('email address not confirmed')) {
    return 'Por favor, confirma tu correo electrónico antes de iniciar sesión. (Puedes desactivar esta verificación en Supabase -> Authentication -> Providers -> Email desactivando la opción "Confirm email").';
  }
  if (msg.includes('signup is disabled') || msg.includes('signups are disabled')) {
    return 'El registro de nuevos usuarios está deshabilitado temporalmente en Supabase.';
  }
  if (msg.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('user already registered') || msg.includes('already exists') || msg.includes('email already in use')) {
    return 'Este correo electrónico ya está registrado por otro administrador.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Demasiadas solicitudes. Por favor, espera unos minutos e inténtalo de nuevo.';
  }
  if (msg.includes('invalid email')) {
    return 'El formato del correo electrónico no es válido.';
  }
  if (msg.includes('fetch failed') || msg.includes('failed to fetch')) {
    return 'Error de conexión. El servidor backend o la base de datos no están disponibles actualmente.';
  }
  return message;
}

export async function adminLogin(_prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor ingresa correo y contraseña.' };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === 'production' }),
            );
          },
        },
      },
    );

    // Intentar inicio de sesión en Supabase
    const { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !session) {
      return { error: translateAuthError(error?.message || 'Credenciales inválidas.') };
    }

    // Verificar rol contra el backend NestJS
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const verifyRes = await fetch(`${apiUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: session.access_token }),
    });

    if (!verifyRes.ok) {
      await supabase.auth.signOut();
      return { error: 'Error al verificar los permisos con el servidor.' };
    }

    const verifyData = await verifyRes.json();

    // Si el usuario no existe en la BD pero sí en Supabase, auto-sincronizamos
    if (!verifyData.success || !verifyData.data) {
      const supabaseUser = session.user;
      const meta = supabaseUser.user_metadata || {};

      // Intentar auto-registrar usando los datos del perfil de Supabase
      const syncRes = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseAuthId: supabaseUser.id,
          email: supabaseUser.email,
          firstName: meta.first_name || meta.full_name?.split(' ')[0] || supabaseUser.email?.split('@')[0] || 'Admin',
          lastName: meta.last_name || meta.full_name?.split(' ').slice(1).join(' ') || 'Phalay',
          role: 'ADMIN',
        }),
      });

      if (!syncRes.ok) {
        await supabase.auth.signOut();
        return { error: 'Tu cuenta de Supabase no está vinculada al sistema. Contacta al soporte.' };
      }

      // Re-verificar después de la sincronización
      const syncData = await syncRes.json();
      if (!syncData.success || !syncData.data) {
        await supabase.auth.signOut();
        return { error: 'Error al sincronizar tu cuenta con el sistema.' };
      }

      // Permitir acceso al usuario recién sincronizado (rol ADMIN por defecto)
    } else {
      const user = verifyData.data;
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        await supabase.auth.signOut();
        return { error: 'No tienes permisos de administrador para ingresar.' };
      }

      if (user.status !== 'ACTIVE') {
        await supabase.auth.signOut();
        return { error: 'Tu cuenta de administrador no está activa. Contacta al administrador del sistema.' };
      }
    }

    // Login exitoso, redireccionar
  } catch (err: any) {
    return { error: 'Error al conectar con el servidor de autenticación.' };
  }

  redirect('/');
}

export async function adminLogout() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  await supabase.auth.signOut();
  redirect('/login');
}

export async function adminRegister(_prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  if (!email || !password || !firstName || !lastName) {
    return { error: 'Por favor, completa todos los campos.' };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === 'production' }),
            );
          },
        },
      },
    );

    // Registrar en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'ADMIN',
        },
      },
    });

    if (authError || !authData.user) {
      return { error: translateAuthError(authError?.message || 'Error al registrar el administrador en Supabase.') };
    }

    // Registrar en NestJS API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const registerRes = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supabaseAuthId: authData.user.id,
        email,
        firstName,
        lastName,
        role: 'ADMIN',
      }),
    });

    if (!registerRes.ok) {
      const err = await registerRes.json().catch(() => ({}));
      return { error: err.message || 'Error al guardar el usuario en el servidor.' };
    }

    // Iniciar sesión automáticamente
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return { error: 'Registro exitoso, pero ocurrió un error al iniciar sesión automáticamente.' };
    }
  } catch (err: any) {
    return { error: 'Error de conexión con el servidor.' };
  }

  redirect('/');
}
