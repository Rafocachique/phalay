'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileText, Mail, Phone } from 'lucide-react';
import { getConsumerClaims, updateConsumerClaim } from '@/app/actions/claims';

type Claim = {
  id: string; claimNumber: string; type: string; firstName: string; lastName: string; email: string; phone: string;
  productOrService: string; amount?: string | number | null; orderNumber?: string | null; detail: string; request: string;
  status: string; response?: string | null; createdAt: string;
};

export default function ConsumerClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Claim | null>(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [saving, setSaving] = useState(false);

  useEffect(() => { getConsumerClaims().then(setClaims).finally(() => setLoading(false)); }, []);
  function open(claim: Claim) { setSelected(claim); setResponse(claim.response || ''); setStatus(claim.status); }
  async function save() {
    if (!selected) return;
    setSaving(true);
    const result = await updateConsumerClaim(selected.id, status, response);
    setSaving(false);
    if ('error' in result) return toast.error(result.error);
    setClaims(current => current.map(item => item.id === selected.id ? { ...item, status, response } : item));
    toast.success('Registro actualizado'); setSelected(null);
  }

  return <div className="animate-enter w-full space-y-8">
    <div><h1 className="text-4xl font-black text-gray-900">Libro de Reclamaciones</h1><p className="mt-2 text-sm text-gray-500">Revisa y responde las solicitudes registradas por tus clientes.</p></div>
    <section className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
      {loading ? <p className="p-8 text-sm text-gray-500">Cargando registros…</p> : claims.length === 0 ? <p className="p-8 text-sm text-gray-500">Aún no hay quejas ni reclamos registrados.</p> : <div className="divide-y divide-gray-100">
        {claims.map(claim => <button key={claim.id} onClick={() => open(claim)} className="grid w-full grid-cols-1 gap-3 p-5 text-left transition hover:bg-[#FFF9F8] md:grid-cols-[1fr_auto_auto] md:items-center">
          <span><strong className="block text-sm text-gray-900">{claim.claimNumber} · {claim.type === 'RECLAMO' ? 'Reclamo' : 'Queja'}</strong><span className="mt-1 block text-xs text-gray-500">{claim.firstName} {claim.lastName} · {claim.productOrService}</span></span>
          <span className="text-xs text-gray-500">{new Date(claim.createdAt).toLocaleDateString('es-PE')}</span>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${claim.status === 'ANSWERED' || claim.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{claim.status === 'PENDING' ? 'Pendiente' : claim.status === 'IN_PROGRESS' ? 'En atención' : claim.status === 'ANSWERED' ? 'Respondido' : 'Cerrado'}</span>
        </button>)}
      </div>}
    </section>
    {selected && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}><section onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-7 shadow-2xl">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-[#FBEFEF] p-2 text-[#8B5A5A]"><FileText size={22} /></span><div><h2 className="text-xl font-bold text-gray-900">{selected.claimNumber}</h2><p className="text-sm text-gray-500">{selected.type === 'RECLAMO' ? 'Reclamo' : 'Queja'} de {selected.firstName} {selected.lastName}</p></div></div>
      <div className="mt-6 grid gap-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 sm:grid-cols-2"><p className="flex gap-2"><Mail size={16} />{selected.email}</p><p className="flex gap-2"><Phone size={16} />{selected.phone}</p><p>Producto/servicio: <strong>{selected.productOrService}</strong></p><p>Pedido: <strong>{selected.orderNumber || 'No indicado'}</strong></p></div>
      <div className="mt-5 space-y-4 text-sm"><p><strong>Detalle:</strong><br />{selected.detail}</p><p><strong>Solicitud:</strong><br />{selected.request}</p></div>
      <div className="mt-6 grid gap-4"><label className="text-sm font-bold text-gray-700">Estado<select value={status} onChange={e => setStatus(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal"><option value="PENDING">Pendiente</option><option value="IN_PROGRESS">En atención</option><option value="ANSWERED">Respondido</option><option value="CLOSED">Cerrado</option></select></label><label className="text-sm font-bold text-gray-700">Respuesta para el registro<textarea value={response} onChange={e => setResponse(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-gray-200 p-3 font-normal" /></label></div>
      <div className="mt-7 flex justify-end gap-3"><button onClick={() => setSelected(null)} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600">Cancelar</button><button disabled={saving} onClick={save} className="rounded-xl bg-[#8B5A5A] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Guardando…' : 'Guardar atención'}</button></div>
    </section></div>}
  </div>;
}
