'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getStoreSettings, updateLegalDocuments } from '@/app/actions/store';

export default function LegalPage() {
  const [privacy, setPrivacy] = useState('');
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStoreSettings().then((settings) => {
      setPrivacy(settings?.legalPrivacyContent || '');
      setTerms(settings?.legalTermsContent || '');
      setLoading(false);
    });
  }, []);

  async function save() {
    if (!privacy.trim() || !terms.trim()) {
      toast.error('Completa ambos documentos antes de guardar.');
      return;
    }
    setSaving(true);
    const result = await updateLegalDocuments({ legalPrivacyContent: privacy, legalTermsContent: terms });
    setSaving(false);
    if (result.success) toast.success('Documentos legales guardados y publicados.');
    else toast.error(result.error || 'No se pudieron guardar los documentos.');
  }

  if (loading) return <div className="py-12 text-center font-bold text-gray-500">Cargando documentos legales…</div>;

  return (
    <div className="animate-enter w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Documentos Legales</h1>
        <p className="mt-2 text-sm text-gray-500">Estos textos se guardan en la base de datos y son exactamente los que se muestran en la tienda.</p>
      </div>
      <div className="mb-6 rounded-2xl border border-[#EBD9D7] bg-[#FFF9F8] p-4 text-sm text-gray-600">
        Usa párrafos separados por una línea vacía y títulos numerados. Puedes incluir <strong>{'{{storeName}}'}</strong>, <strong>{'{{legalName}}'}</strong>, <strong>{'{{businessRuc}}'}</strong>, <strong>{'{{businessAddress}}'}</strong> y <strong>{'{{contactEmail}}'}</strong>; se reemplazan por la configuración actual de tu tienda.
      </div>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">⚖️ Políticas de Privacidad</h2>
          <textarea value={privacy} onChange={(e) => setPrivacy(e.target.value)} rows={18} className="w-full rounded-xl bg-[#F8F9FA] px-4 py-3.5 text-sm leading-6 text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-[#8B5A5A]" />
        </section>
        <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">📜 Términos y Condiciones</h2>
          <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={18} className="w-full rounded-xl bg-[#F8F9FA] px-4 py-3.5 text-sm leading-6 text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-[#8B5A5A]" />
        </section>
      </div>
      <div className="sticky bottom-4 mt-6 flex justify-end">
        <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-[#8B5A5A] px-8 py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-[#A87474] disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar y publicar documentos'}
        </button>
      </div>
    </div>
  );
}
