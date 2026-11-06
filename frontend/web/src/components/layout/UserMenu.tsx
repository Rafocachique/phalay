'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { User, LogOut, Package, ChevronDown } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { signout } from '@/app/auth/actions';

/**
 * Muestra el estado real de la sesión en la barra superior.
 *
 * Se suscribe a onAuthStateChange para que al iniciar o cerrar sesión la
 * cabecera se actualice sola, sin necesidad de recargar la página.
 */
type InitialUser = { email: string; firstName: string; lastName: string } | null;

/** Datos mínimos que la cabecera necesita, vengan del servidor o del cliente. */
type MenuUser = { email: string; firstName: string; lastName: string };

function fromSupabase(u: SupabaseUser): MenuUser {
  const meta = u.user_metadata || {};
  return {
    email: u.email ?? '',
    firstName: meta.first_name ?? '',
    lastName: meta.last_name ?? '',
  };
}

export function UserMenu({ locale, initialUser = null }: { locale: string; initialUser?: InitialUser }) {
  // El servidor ya resolvió la sesión, así que no hay estado de carga: la
  // cabecera es correcta desde el primer render, incluso justo después de
  // iniciar sesión.
  const [user, setUser] = useState<MenuUser | null>(initialUser);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initialEmail = initialUser?.email ?? null;

  // Mantener sincronizado si el servidor vuelve a renderizar con otra sesión
  useEffect(() => {
    setUser(initialUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmail]);

  useEffect(() => {
    const supabase = createClient();

    // Refleja en vivo los cambios hechos desde el propio navegador
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? fromSupabase(session.user) : null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  if (!user) {
    return (
      <Link
        href={`/${locale}/auth/login`}
        className="flex items-center gap-2 text-gray-600 hover:text-[#8B5A5A] transition-colors font-medium"
      >
        <User size={20} />
        <span className="text-sm hidden lg:inline">Iniciar Sesión</span>
      </Link>
    );
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.email?.split('@')[0] ||
    'Mi cuenta';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-600 hover:text-[#8B5A5A] transition-colors font-medium"
      >
        <span className="w-8 h-8 rounded-full bg-[#FBEFEF] text-[#8B5A5A] flex items-center justify-center text-xs font-bold">
          {initials}
        </span>
        <span className="text-sm hidden lg:inline max-w-[140px] truncate">{displayName}</span>
        <ChevronDown size={14} className={`hidden lg:inline transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <Link
            href={`/${locale}/mis-pedidos`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Package size={16} className="text-gray-400" />
            Mis Pedidos
          </Link>

          <form action={signout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
