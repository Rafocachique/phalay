'use client';

import { adminLogin } from '@/app/auth/actions';
import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Clock } from 'lucide-react';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(adminLogin, null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  // El middleware añade ?motivo=inactividad al cerrar la sesión por tiempo,
  // para que no parezca que la sesión se cayó sin explicación.
  const cerradaPorInactividad = searchParams.get('motivo') === 'inactividad';

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* 1. Header estilo PHALAY (Logo a la izquierda) */}
      <header className="w-full px-8 py-4 flex items-center justify-between border-b border-gray-100 bg-white/70 backdrop-blur-md sticky top-0 left-0 z-30">
        <Link 
          href={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} 
          className="text-3xl sm:text-4xl font-black tracking-[0.2em] text-[#8B5A5A] uppercase font-serif transition-colors hover:text-[#7A4B4B]"
        >
          PHALAY
        </Link>
        <Link 
          href={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} 
          className="text-xs font-bold text-gray-500 hover:text-[#8B5A5A] tracking-widest uppercase transition-colors"
        >
          Volver a la Tienda
        </Link>
      </header>

      {/* Decorative blurred background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-[#8B5A5A]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] left-[-10%] w-96 h-96 bg-[#8B5A5A]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* 2. Main login card container */}
      <div className="flex-grow flex items-center justify-center p-6 relative z-10 py-16">
        <div className="w-full max-w-5xl bg-white rounded-[2.5rem] overflow-hidden shadow-[0_25px_60px_rgba(139,90,90,0.12)] border border-gray-100 grid grid-cols-1 md:grid-cols-12 min-h-[580px] transition-all duration-300">
          
          {/* Columna Izquierda: Visual Premium con Imagen Editorial */}
          <div className="hidden md:flex md:col-span-5 relative flex-col justify-between p-12 text-white overflow-hidden">
            {/* Imagen de fondo fashion editorial */}
            <img 
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80" 
              alt="Moda Phalay" 
              className="absolute inset-0 w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-[8000ms]"
            />
            {/* Overlay elegante con gradiente cálido de marca */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#8B5A5A] via-[#8B5A5A]/70 to-black/35 mix-blend-multiply" />
            
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-bold tracking-widest text-[#E8C5C4] uppercase">Exclusividad</span>
              <h2 className="text-3xl font-serif font-black leading-tight tracking-wide">Panel de Administración</h2>
              <p className="text-white/80 text-xs font-medium leading-relaxed">
                Gestiona tu catálogo de alta costura, haz el seguimiento de tus pedidos exclusivos y personaliza la experiencia visual de tu marca.
              </p>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white/95">Catálogo y Colecciones</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white/95">Gestión de Pedidos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white/95">Control de Usuarios y Roles</span>
              </div>
            </div>

            <div className="relative z-10 text-[9px] text-[#E8C5C4]/70 tracking-widest font-black uppercase">
              © 2026 PHALAY
            </div>
          </div>

          {/* Columna Derecha: Formulario Limpio e Interactivo */}
          <div className="col-span-12 md:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white relative">
            <div className="mb-8">
              <h1 className="text-3xl font-serif font-black text-gray-900 mb-2">Ingresar al Panel</h1>
              <p className="text-sm text-gray-500 font-medium">Introduce tus credenciales de acceso administrativo.</p>
            </div>

            {/* Alerta de sesión cerrada por inactividad */}
            {cerradaPorInactividad && !state?.error && (
              <div className="mb-6 p-4 bg-[#FAF7F7] border border-[#EBE3E3] rounded-2xl flex items-start gap-3 animate-enter">
                <Clock className="w-5 h-5 text-[#8B5A5A] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-[#8B5A5A] font-bold uppercase tracking-wider leading-relaxed">
                  Sesión expirada por inactividad. Inicia sesión nuevamente.
                </span>
              </div>
            )}

            {/* Caja de errores */}
            {state?.error && (
              <div className="mb-6 space-y-4 animate-shake">
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-600 font-semibold">{state.error}</span>
                </div>

                {/* Mensaje instructivo si el proveedor de email está apagado en Supabase */}
                {(state.error.includes('deshabilitado') || state.error.includes('Email logins are disabled')) && (
                  <div className="p-5 bg-[#FAF7F7] border border-[#EBE3E3] rounded-2xl text-left space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-[#8B5A5A] font-bold text-xs uppercase tracking-wider">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Activar Proveedor de Correo</span>
                    </div>
                    <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside leading-relaxed pl-1 font-medium">
                      <li>Ingresa a tu <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#8B5A5A] font-bold underline hover:text-[#7A4B4B]">Dashboard de Supabase</a>.</li>
                      <li>Selecciona tu proyecto <strong>Phalay</strong>.</li>
                      <li>En el menú de la izquierda, ve a <strong>Authentication</strong> &gt; <strong>Providers</strong>.</li>
                      <li>Busca la sección de <strong>Email</strong> y actívala (interruptor en verde).</li>
                      <li>Guarda los cambios y recarga esta página.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Formulario */}
            <form action={formAction} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={isPending}
                  placeholder="admin@phalay.com"
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#8B5A5A] focus:ring-4 focus:ring-[#8B5A5A]/5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    disabled={isPending}
                    placeholder="••••••••"
                    className="w-full bg-[#F8F9FA] border border-transparent rounded-2xl pl-4 pr-12 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#8B5A5A] focus:ring-4 focus:ring-[#8B5A5A]/5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={isPending}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50 p-1 rounded-full hover:bg-gray-200/50"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white font-bold py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(139,90,90,0.2)]"
              >
                {isPending && (
                  <svg className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" viewBox="0 0 24 24" />
                )}
                {isPending ? 'Validando Acceso...' : 'Ingresar al Panel'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link 
                href={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} 
                className="text-xs font-bold text-gray-400 hover:text-gray-600 tracking-wider uppercase transition-colors"
              >
                Volver al sitio de clientes
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="w-full py-6 text-center text-[10px] text-gray-400 font-semibold tracking-wider uppercase border-t border-gray-50 bg-white/40">
        © 2026 PHALAY — Todos los derechos reservados.
      </footer>

    </div>
  );
}
