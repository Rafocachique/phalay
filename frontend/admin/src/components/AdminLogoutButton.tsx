'use client';

import { adminLogout } from '@/app/auth/actions';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await adminLogout();
    } finally {
      // Navegación dura: garantiza que se descarte la caché del router y que
      // la clienta vea de verdad la pantalla de login.
      window.location.href = '/login';
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <LogOut size={18} strokeWidth={2.5} />
      {isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
    </button>
  );
}
