'use client';

import Link from 'next/link';
import { useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { verifyAccountCode, resendVerificationCode } from '@/app/auth/actions';
import { MailCheck } from 'lucide-react';

const RESEND_COOLDOWN_SECONDS = 45;

export default function VerifyAccountPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [state, formAction, isPending] = useActionState(verifyAccountCode, null);

  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, startResend] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleResend() {
    setResendMessage(null);
    startResend(async () => {
      const result = await resendVerificationCode(email);
      if (result.error) {
        setResendMessage(result.error);
      } else {
        setResendMessage('Te enviamos un nuevo código.');
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-premium p-10 animate-enter text-center">
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#8B5A5A] mb-8 inline-block">PHALAY</Link>

        <div className="w-14 h-14 rounded-2xl bg-[#FBEFEF] text-[#8B5A5A] flex items-center justify-center mx-auto mb-5">
          <MailCheck size={24} />
        </div>

        <h1 className="text-2xl font-serif text-gray-900 mb-2">Confirma tu cuenta</h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">
          Te enviamos un código de 6 dígitos a{' '}
          {email ? <strong className="text-gray-800">{email}</strong> : 'tu correo'}. Ingrésalo aquí abajo.
        </p>

        {state?.error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-left">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <input
            type="text"
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoFocus
            required
            placeholder="000000"
            className="w-full text-center text-3xl font-black tracking-[0.5em] bg-[#F8F8F8] border border-transparent rounded-xl py-4 pl-6 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900"
          />

          <button
            type="submit"
            disabled={isPending || !email}
            className="w-full bg-[#8B5A5A] hover:bg-[#A87474] text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {isPending ? 'Verificando...' : 'Verificar cuenta'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          {resendMessage && <p className="text-xs text-gray-500 mb-3">{resendMessage}</p>}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending || !email}
            className="text-sm font-bold text-[#8B5A5A] hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
          >
            {isResending ? 'Enviando...' : cooldown > 0 ? `Reenviar código en ${cooldown}s` : 'Reenviar código'}
          </button>
        </div>
      </div>
    </div>
  );
}
