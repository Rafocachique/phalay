'use client';

import { useState } from 'react';
import { FileCheck2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import { updateShippingProof } from '@/app/actions/orders';

interface ShippingDispatchProofProps {
  orderId: string;
  orderNumber: string;
  destinationType?: string | null;
  destinationLabel?: string | null;
  proofUrl?: string | null;
  receiptNumber?: string | null;
}

export default function ShippingDispatchProof({
  orderId,
  orderNumber,
  destinationType,
  destinationLabel,
  proofUrl: initialProofUrl,
  receiptNumber: initialReceiptNumber,
}: ShippingDispatchProofProps) {
  const router = useRouter();
  const [proofUrl, setProofUrl] = useState(initialProofUrl || '');
  const [receiptNumber, setReceiptNumber] = useState(initialReceiptNumber || '');
  const [saving, setSaving] = useState(false);
  const isProvince = destinationType?.toUpperCase().includes('PROVINCIA');

  const save = async () => {
    setSaving(true);
    const result = await updateShippingProof(orderId, proofUrl, receiptNumber);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Constancia del pedido ${orderNumber} guardada`);
    router.refresh();
  };

  return (
    <section className="border-t border-gray-100 px-8 py-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700"><FileCheck2 size={17} /></div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">Constancia de despacho <span className="font-normal text-gray-400">(opcional)</span></h4>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {isProvince
              ? `Adjunta la foto de la boleta o guía de ${destinationLabel || 'la agencia'}, si la tienes.`
              : 'Adjunta la captura de entrega, boleta o constancia del delivery, si corresponde.'}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ImageUpload name={`shipping_proof_${orderId}`} label={isProvince ? 'Foto de boleta o guía' : 'Captura o constancia de delivery'} currentUrl={proofUrl} onUrlChange={setProofUrl} />
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
          <label className="mb-2 block text-sm font-bold text-gray-900">Número de boleta, guía o referencia <span className="font-normal text-gray-400">(opcional)</span></label>
          <input
            value={receiptNumber}
            onChange={(event) => setReceiptNumber(event.target.value)}
            maxLength={120}
            placeholder={isProvince ? 'Ej. Guía 001-123456' : 'Ej. Delivery 10234'}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B5A5A]"
          />
          <p className="mt-2 text-xs text-gray-400">Puedes guardar sólo la imagen, sólo el número o ambos.</p>
          <button type="button" onClick={save} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B5A5A] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6A3F3F] disabled:opacity-50">
            <Save size={16} /> {saving ? 'Guardando…' : 'Guardar constancia'}
          </button>
        </div>
      </div>
    </section>
  );
}
