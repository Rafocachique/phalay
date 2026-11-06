'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { login } from '@/app/auth/actions';
import { useActionState } from 'react';
import PasswordInput from '@/components/auth/PasswordInput';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);
  const params = useParams();
  const locale = String(params?.locale || 'es');
  const searchParams = useSearchParams();
  // El middleware añade ?redirect_to=... cuando bloquea una ruta protegida
  // (p. ej. el checkout), para devolver a la clienta ahí tras autenticarse.
  const redirectTo = searchParams.get('redirect_to') || `/${locale}/catalogo`;
  const isFromCheckout = /\/checkout/.test(redirectTo);

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-4">
      <div className="w-full max-w-[1000px] bg-white rounded-[2rem] shadow-premium overflow-hidden flex animate-enter">
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#8B5A5A] mb-12">PHALAY</Link>
          
          {/* Si llega desde el checkout se le explica por qué se le pide la
              cuenta, en lugar de dejarla adivinando por qué salió del pago. */}
          {isFromCheckout ? (
            <>
              <h1 className="text-3xl font-serif text-gray-900 mb-2">Inicia sesión para pagar</h1>
              <p className="text-sm text-gray-500 mb-6 font-medium">
                Necesitamos tu cuenta para guardar tu pedido y que puedas seguirlo hasta la entrega.
              </p>
              <div className="mb-8 flex items-center gap-3 bg-[#FBEFEF] border border-[#8B5A5A]/15 text-[#8B5A5A] rounded-xl px-4 py-3 text-sm font-medium">
                <ShoppingBag size={18} className="flex-shrink-0" />
                <span>Tu bolsa te espera: al ingresar volvemos justo donde estabas.</span>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-serif text-gray-900 mb-2">Bienvenida de nuevo</h1>
              <p className="text-sm text-gray-500 mb-8 font-medium">Ingresa a tu cuenta para continuar tu experiencia.</p>
            </>
          )}

          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="redirect_to" value={redirectTo} />
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <input 
                type="email" 
                name="email"
                required
                disabled={isPending}
                placeholder="tu@correo.com" 
                className="w-full bg-[#F8F8F8] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Contraseña</label>
                <Link href="#" className="text-xs font-semibold text-[#8B5A5A] hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>
              <PasswordInput name="password" required disabled={isPending} placeholder="••••••••" />
            </div>

            <button
              type="submit" 
              disabled={isPending} 
              className="w-full bg-[#8B5A5A] hover:bg-[#A87474] text-white font-medium py-4 rounded-xl transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-gray-100 flex-1" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">o con tu correo</span>
            <div className="h-px bg-gray-100 flex-1" />
          </div>

          <GoogleSignInButton redirectTo={redirectTo} />

          <div className="mt-8 pt-8 border-t border-gray-100 text-center space-y-3">
            <p className="text-sm text-gray-600 font-medium">
              ¿No tienes una cuenta? <Link href={`/${locale}/auth/registro`} className="text-[#8B5A5A] font-bold hover:underline">Regístrate aquí</Link>
            </p>
            <Link href={`/${locale}/mis-pedidos`} className="block text-xs text-gray-400 hover:text-[#8B5A5A]">
              Ver mis pedidos anteriores
            </Link>
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="hidden md:block w-1/2 relative bg-gray-100">
          <img 
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80" 
            alt="Fashion Model" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <h2 className="text-3xl font-serif mb-2">Descubre tu estilo</h2>
            <p className="text-sm text-white/80">Accede a colecciones exclusivas y conecta con las mejores boutiques independientes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
