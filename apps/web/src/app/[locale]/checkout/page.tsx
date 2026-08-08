import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CheckoutClient, { type CheckoutProfile } from './CheckoutClient';

// El checkout nunca debe servirse desde caché: la sesión se comprueba en cada
// visita. Sin esto, Next.js podía entregar la página guardada y se llegaba a
// pagar sin haber iniciado sesión.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

/**
 * Comprobación de sesión en el servidor. Es la barrera real: el middleware no
 * interviene cuando la navegación se resuelve desde el router cache del cliente.
 */
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login?redirect_to=/${locale}/checkout`);
  }

  // Datos de la cuenta para que el formulario nazca lleno.
  const meta = user.user_metadata || {};
  const profile: CheckoutProfile = {
    email: user.email ?? '',
    name: [meta.first_name, meta.last_name].filter(Boolean).join(' ') || meta.full_name || '',
    dni: '',
    phone: '',
  };

  // El perfil de nuestra BD añade DNI y teléfono de compras anteriores.
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const { data: dbProfile } = await res.json();
        profile.name =
          [dbProfile.firstName, dbProfile.lastName].filter(Boolean).join(' ') || profile.name;
        profile.email = dbProfile.email || profile.email;
        profile.dni = dbProfile.dni || '';
        profile.phone = dbProfile.phone || '';
      }
    }
  } catch {
    // Si la API no responde, se continúa con los datos de la sesión
  }

  return <CheckoutClient profile={profile} />;
}
