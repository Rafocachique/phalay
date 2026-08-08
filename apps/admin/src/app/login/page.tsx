'use client';

import { adminLogin } from '@/app/auth/actions';
import { useActionState } from 'react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(adminLogin, null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F8F8] via-[#FDFCFC] to-[#F0EDED] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#8B5A5A] opacity-5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#8B5A5A] opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Left: Visual */}
          <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#8B5A5A] to-[#A87474] text-white relative overflow-hidden">
            {/* Decorative dots */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl transform -translate-x-1/3 translate-y-1/3"></div>

            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-4 tracking-tight leading-tight">Panel de Administración</h2>
              <p className="text-white/85 text-sm leading-relaxed">
                Gestiona tu tienda, productos, pedidos y contenido visual de forma centralizada.
              </p>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white/90 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-white/95">Catálogo de productos completo</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white/90 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-white/95">Control de órdenes y seguimiento</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white/90 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-white/95">Gestión de colecciones y categorías</span>
              </div>
            </div>

            <div className="relative z-10 text-xs text-white/60">
              © 2026 PHALAY - Todos los derechos reservados
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-8 md:hidden">
              <h2 className="text-3xl font-black text-[#8B5A5A] tracking-tighter mb-1">PHALAY</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Admin Panel</p>
            </div>

            <div className="hidden md:block mb-8">
              <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Bienvenido</h1>
              <p className="text-sm text-gray-600">Ingresa a tu panel administrativo</p>
            </div>

            {state?.error && (
              <div className="mb-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-600 font-medium">{state.error}</span>
                </div>

                {(state.error.includes('deshabilitado') || state.error.includes('Email logins are disabled')) && (
                  <div className="mt-4 p-5 bg-[#FAF7F7] border border-[#EBE3E3] rounded-xl text-left space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-[#8B5A5A] font-bold text-sm">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>¿Cómo solucionar este problema?</span>
                    </div>
                    <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside leading-relaxed pl-1">
                      <li>Ingresa a tu <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#8B5A5A] font-semibold underline hover:text-[#7A4B4B]">Dashboard de Supabase</a>.</li>
                      <li>Selecciona tu proyecto de <strong>Phalay</strong>.</li>
                      <li>En el menú de la izquierda, ve a <strong>Authentication</strong> y luego a <strong>Providers</strong>.</li>
                      <li>Busca la sección de <strong>Email</strong> y haz clic para expandirla.</li>
                      <li>Activa el interruptor <strong>Enable Email provider</strong> (debe quedar en verde).</li>
                      <li>Guarda los cambios, regresa a esta página y recarga para intentar de nuevo.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <form action={formAction} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={isPending}
                  placeholder="admin@phalay.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#8B5A5A] focus:ring-2 focus:ring-[#8B5A5A]/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  required
                  disabled={isPending}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#8B5A5A] focus:ring-2 focus:ring-[#8B5A5A]/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-[#8B5A5A] to-[#A87474] hover:from-[#9B6A6A] hover:to-[#B88484] text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg"
              >
                {isPending && (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isPending ? 'Ingresando...' : 'Ingresar al Panel'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
              <p>
                ¿No tienes cuenta de administrador?{' '}
                <Link href="/register" className="text-[#8B5A5A] font-semibold hover:underline">
                  Registrarse aquí
                </Link>
              </p>
              <p>
                <Link href="/" className="text-gray-400 hover:text-gray-600 font-medium transition-colors">
                  Volver al sitio de clientes
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
