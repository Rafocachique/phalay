'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { signup } from '@/app/auth/actions';
import { useActionState } from 'react';
import PasswordInput from '@/components/auth/PasswordInput';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signup, null);
  const params = useParams();
  const locale = String(params?.locale || 'es');

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-4">
      <div className="w-full max-w-[1000px] bg-white rounded-[2rem] shadow-premium overflow-hidden flex animate-enter">
        {/* Left Side: Image */}
        <div className="hidden md:block w-1/2 relative bg-gray-100">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80"
            alt="Fashion Designer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <h2 className="text-3xl font-serif mb-2">Únete a PHALAY</h2>
            <p className="text-sm text-white/90">
              Descubre piezas únicas, guarda tus favoritos y gestiona tus pedidos con facilidad.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-10 lg:p-12 flex flex-col justify-center overflow-y-auto max-h-screen">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#8B5A5A] mb-8">PHALAY</Link>

          <h1 className="text-3xl font-serif text-gray-900 mb-2">Crear Cuenta</h1>
          <p className="text-sm text-gray-500 mb-8 font-medium">Únete a PHALAY y descubre moda exclusiva.</p>

          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2">Nombre</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="Tu nombre"
                  className="w-full bg-[#F8F8F8] border border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2">Apellidos</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Tus apellidos"
                  className="w-full bg-[#F8F8F8] border border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                required
                placeholder="tu@correo.com"
                className="w-full bg-[#F8F8F8] border border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2">Contraseña</label>
              <PasswordInput name="password" required minLength={8} placeholder="Mínimo 8 caracteres" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2">Confirmar Contraseña</label>
              <PasswordInput name="confirmPassword" required minLength={8} placeholder="Repite tu contraseña" />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#8B5A5A] hover:bg-[#A87474] text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending ? 'Creando...' : 'Crear mi cuenta'}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-gray-100 flex-1" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">o con tu correo</span>
            <div className="h-px bg-gray-100 flex-1" />
          </div>

          <GoogleSignInButton />

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600 font-medium">
              ¿Ya tienes una cuenta? <Link href={`/${locale}/auth/login`} className="text-[#8B5A5A] font-bold hover:underline">Inicia Sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
