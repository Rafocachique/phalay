'use client';

import { useEffect, useRef, useState } from 'react';
import { adminLogout } from '@/app/auth/actions';
import { Clock } from 'lucide-react';

const WARNING_SECONDS = 60;
const PING_INTERVAL_MS = 4 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

interface IdleSessionGuardProps {
  /** Minutos de inactividad permitidos. Debe coincidir con el del middleware. */
  timeoutMinutes: number;
}

/**
 * Aviso y cierre de sesión por inactividad.
 *
 * El corte de verdad lo hace el middleware en el servidor; esto es la capa de
 * cortesía: avisa antes de cerrar y cierra sola sin esperar a que la persona
 * navegue. Mientras haya actividad real, avisa al servidor para que no la dé
 * por ausente en mitad de un formulario largo.
 */
export default function IdleSessionGuard({ timeoutMinutes }: IdleSessionGuardProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivityRef = useRef(Date.now());
  const activitySincePingRef = useRef(false);
  const closingRef = useRef(false);

  useEffect(() => {
    const timeoutMs = Math.max(1, timeoutMinutes) * 60 * 1000;

    const markActivity = () => {
      lastActivityRef.current = Date.now();
      activitySincePingRef.current = true;
      setSecondsLeft((prev) => (prev === null ? null : null)); // oculta el aviso al volver
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActivity, { passive: true }));

    const tick = setInterval(async () => {
      const idleMs = Date.now() - lastActivityRef.current;
      const restanteMs = timeoutMs - idleMs;

      if (restanteMs <= 0) {
        if (closingRef.current) return;
        closingRef.current = true;
        clearInterval(tick);
        try {
          await adminLogout();
        } finally {
          window.location.href = '/login?motivo=inactividad';
        }
        return;
      }

      setSecondsLeft(restanteMs <= WARNING_SECONDS * 1000 ? Math.ceil(restanteMs / 1000) : null);
    }, 1000);

    // Renueva la marca del servidor sólo si hubo actividad: sin esto, una
    // pestaña abierta y olvidada mantendría la sesión viva para siempre.
    const ping = setInterval(() => {
      if (!activitySincePingRef.current) return;
      activitySincePingRef.current = false;
      fetch('/api/keepalive', { method: 'POST', cache: 'no-store' }).catch(() => undefined);
    }, PING_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActivity));
      clearInterval(tick);
      clearInterval(ping);
    };
  }, [timeoutMinutes]);

  if (secondsLeft === null) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-xl max-w-sm w-full p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FBEFEF] text-[#8B5A5A] flex items-center justify-center mx-auto mb-5">
          <Clock size={26} />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">¿Sigues ahí?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Por seguridad cerraremos tu sesión en <strong className="text-[#8B5A5A]">{secondsLeft}s</strong> por
          inactividad.
        </p>
        <button
          type="button"
          onClick={() => {
            lastActivityRef.current = Date.now();
            activitySincePingRef.current = false;
            setSecondsLeft(null);
            fetch('/api/keepalive', { method: 'POST', cache: 'no-store' }).catch(() => undefined);
          }}
          className="w-full bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white font-bold py-3.5 rounded-2xl transition-colors"
        >
          Seguir trabajando
        </button>
      </div>
    </div>
  );
}
