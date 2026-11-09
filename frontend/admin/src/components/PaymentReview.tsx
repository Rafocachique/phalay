'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { reviewOrderPayment } from '@/app/actions/orders';
import { ConfirmDialog } from '@/components/ConfirmDialog';

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
  shippingPaymentPending = false,
  shippingUnpaid = false,
  shippingCost = 0,
}: {
  orderId: string;
  paymentStatus: string;
  paymentMethod: string;
  total: string | number;
  shippingPaymentPending?: boolean;
  shippingUnpaid?: boolean;
  shippingCost?: string | number;
}) {
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const router = useRouter();

  // Los pagos con tarjeta o Yape automático los confirma Culqi, no el equipo.
  const isManual = paymentMethod?.toUpperCase() === 'TRANSFERENCIA';

  const handleReview = async (approved: boolean) => {
    setLoading(true);
    const result = await reviewOrderPayment(orderId, approved);
    setLoading(false);

    if ('error' in result) {
      toast.error(result.error || 'No se pudo actualizar el pago');
      return;
    }

    toast.success(approved
      ? shippingPaymentPending ? 'Pago de envío confirmado.' : 'Pago confirmado. El pedido pasó a Confirmado.'
      : shippingPaymentPending ? 'Pago de envío marcado como no verificado.' : 'Pago marcado como no verificado.');
    router.refresh();
  };

  const rejectPayment = () => setShowRejectDialog(true);

  if (paymentStatus === 'COMPLETED' && !shippingPaymentPending) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${shippingUnpaid ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-green-200 bg-green-50 text-green-700'}`}>
        <CheckCircle2 size={13} /> {shippingUnpaid ? `Prendas confirmadas · envío pendiente S/ ${Number(shippingCost).toFixed(2)}` : 'Pago confirmado'}
      </span>
    );
  }

  if (shippingPaymentPending) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
          <Clock size={13} /> Envío pendiente de revisión · S/ {Number(shippingCost).toFixed(2)}
        </span>
        <button onClick={() => handleReview(true)} disabled={loading} className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50">
          <CheckCircle2 size={13} /> Confirmar envío
        </button>
        <button onClick={rejectPayment} disabled={loading} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-500 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50">
          <XCircle size={13} /> No llegó
        </button>
        <ConfirmDialog open={showRejectDialog} title="¿Marcar el pago de envío como no verificado?" description="La clienta podrá comunicarse contigo para enviar un nuevo comprobante." confirmLabel="Marcar como no verificado" busy={loading} onCancel={() => setShowRejectDialog(false)} onConfirm={() => { setShowRejectDialog(false); handleReview(false); }} />
      </div>
    );
  }

  if (!isManual) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-600">
        <Clock size={13} /> Esperando confirmación de la pasarela
      </span>
    );
  }

  if (paymentStatus === 'FAILED') {
    return (
      <>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700">
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
      <ConfirmDialog
        open={showRejectDialog}
        title="¿Marcar pago como no verificado?"
        description="El pedido quedará pendiente para que puedas contactar a la clienta."
        confirmLabel="Marcar como no verificado"
        busy={loading}
        onCancel={() => setShowRejectDialog(false)}
        onConfirm={() => { setShowRejectDialog(false); handleReview(false); }}
      />
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
        <Clock size={13} /> Esperando tu revisión
      </span>
      <button
        onClick={() => handleReview(true)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
      >
        <CheckCircle2 size={13} /> Confirmar prendas · S/ {Number(total).toFixed(2)}
      </button>
      <button
        onClick={rejectPayment}
        disabled={loading}
        className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-500 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
      >
        <XCircle size={13} /> No llegó
      </button>
      <ConfirmDialog
        open={showRejectDialog}
        title="¿Marcar pago como no verificado?"
        description="El pedido quedará pendiente para que puedas contactar a la clienta."
        confirmLabel="Marcar como no verificado"
        busy={loading}
        onCancel={() => setShowRejectDialog(false)}
        onConfirm={() => { setShowRejectDialog(false); handleReview(false); }}
      />
    </div>
  );
}
