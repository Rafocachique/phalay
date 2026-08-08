// =========================================
// Cliente Supabase para el Navegador (CSR)
// =========================================

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

/**
 * Crea cliente Supabase para componentes del cliente.
 * Usa cookies para mantener sesión segura.
 * NUNCA usa service_role aquí.
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
