'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { reviewOrderPayment } from '@/app/actions/orders';

/**
 * Confirmación manual del pago (Yape con QR).
 * La clienta envía su captura por WhatsApp y aquí se registra si el dinero
 * llegó: al aprobarlo el pedido pasa a CONFIRMADO y sigue al envío.
 */
export default function PaymentReview({
  orderId,
  paymentStatus,
  paymentMethod,
  total,
}: {
  orderId: string;
  paymentStatus: string;
  paymentMethod: string;
  total: string | number;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Los pagos con tarjeta o Yape automático los confirma Culqi, no el equipo.
  const isManual = paymentMethod?.toUpperCase() === 'TRANSFERENCIA';

  const handleReview = async (approved: boolean) => {
    if (!approved && !confirm('¿Marcar este pago como no verificado?')) return;

    setLoading(true);
    const result = await reviewOrderPayment(orderId, approved);
    setLoading(false);

    if ('error' in result) {
      toast.error(result.error || 'No se pudo actualizar el pago');
      return;
    }

    toast.success(approved ? 'Pago confirmado. El pedido pasó a Confirmado.' : 'Pago marcado como no verificado.');
    router.refresh();
  };

  if (paymentStatus === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">
        <CheckCircle2 size={13} /> Pago confirmado
      </span>
    );
  }

  if (!isManual) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600">
        <Clock size={13} /> Esperando confirmación de la pasarela
      </span>
    );
  }

  if (paymentStatus === 'FAILED') {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
          <XCircle size={13} /> Pago no verificado
        </span>
        <button
          onClick={() => handleReview(true)}
          disabled={loading}
          className="text-[11px] font-bold text-green-700 hover:underline disabled:opacity-50"
        >
          Confirmar de todas formas
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
        <Clock size={13} /> Esperando tu revisión
      </span>
      <button
        onClick={() => handleReview(true)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
      >
        <CheckCircle2 size={13} /> Recibí S/ {Number(total).toFixed(2)}
      </button>
      <button
        onClick={() => handleReview(false)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-500 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
      >
        <XCircle size={13} /> No llegó
      </button>
    </div>
  );
}
