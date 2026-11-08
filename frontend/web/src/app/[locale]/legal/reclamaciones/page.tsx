'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const emptyForm = {
  type: 'RECLAMO', firstName: '', lastName: '', documentType: 'DNI', documentNumber: '',
  email: '', phone: '', address: '', isMinor: false, guardianName: '', productOrService: '',
  amount: '', orderNumber: '', detail: '', request: '',
};

export default function LibroReclamacionesPage() {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [claimNumber, setClaimNumber] = useState('');

  const update = (key: keyof typeof emptyForm, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true); setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/claims`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: form.amount ? Number(form.amount) : undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'No pudimos registrar tu solicitud.');
      setClaimNumber(data.claimNumber);
      setForm(emptyForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos registrar tu solicitud.');
    } finally { setSending(false); }
  }

  if (claimNumber) return (
    <div className="min-h-screen bg-[#F8F8F8] px-6 py-24">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-emerald-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={34} /></div>
        <h1 className="font-serif text-3xl font-bold text-gray-900">Solicitud registrada</h1>
        <p className="mt-3 text-gray-600">Tu constancia es <strong className="text-[#8B5A5A]">{claimNumber}</strong>. Guárdala para consultar la atención de tu caso.</p>
        <button onClick={() => setClaimNumber('')} className="mt-7 rounded-xl bg-[#8B5A5A] px-6 py-3 text-sm font-bold text-white hover:bg-[#744848]">Registrar otra solicitud</button>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F8F8] py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-8 flex items-start gap-4">
          <div className="rounded-2xl bg-[#FBEFEF] p-3 text-[#8B5A5A]"><FileText size={26} /></div>
          <div><h1 className="font-serif text-4xl font-bold text-gray-900">Libro de Reclamaciones</h1><p className="mt-2 text-gray-600">Registra aquí tu queja o reclamo. Recibirás una constancia al finalizar.</p></div>
        </div>
        <div className="mb-6 flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800"><ShieldCheck className="mt-0.5 shrink-0" size={20} /><p><strong>Reclamo:</strong> disconformidad relacionada con productos o atención. <strong>Queja:</strong> malestar respecto del servicio o trato recibido.</p></div>
        <form onSubmit={submit} className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
          <fieldset className="grid gap-5 md:grid-cols-2">
            <legend className="mb-5 text-lg font-bold text-gray-900">Identificación de la persona consumidora</legend>
            <label className="text-sm font-bold text-gray-700">Tipo de solicitud<select value={form.type} onChange={e => update('type', e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-[#8B5A5A]"><option value="RECLAMO">Reclamo</option><option value="QUEJA">Queja</option></select></label>
            <label className="text-sm font-bold text-gray-700">Tipo de documento<select value={form.documentType} onChange={e => update('documentType', e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-[#8B5A5A]"><option>DNI</option><option>CE</option><option>Pasaporte</option></select></label>
            <Input label="Nombres" value={form.firstName} onChange={value => update('firstName', value)} required />
            <Input label="Apellidos" value={form.lastName} onChange={value => update('lastName', value)} required />
            <Input label="Número de documento" value={form.documentNumber} onChange={value => update('documentNumber', value)} required />
            <Input label="Teléfono" value={form.phone} onChange={value => update('phone', value)} inputMode="tel" required />
            <Input label="Correo electrónico" value={form.email} onChange={value => update('email', value)} type="email" required />
            <Input label="Domicilio" value={form.address} onChange={value => update('address', value)} required />
          </fieldset>
          <label className="mt-5 flex items-center gap-3 text-sm text-gray-700"><input type="checkbox" checked={form.isMinor} onChange={e => update('isMinor', e.target.checked)} className="h-4 w-4 accent-[#8B5A5A]" /> La persona consumidora es menor de edad.</label>
          {form.isMinor && <div className="mt-4"><Input label="Nombre de madre, padre o apoderado" value={form.guardianName} onChange={value => update('guardianName', value)} required /></div>}
          <fieldset className="mt-8 grid gap-5 md:grid-cols-2"><legend className="mb-5 text-lg font-bold text-gray-900">Detalle de la solicitud</legend><Input label="Producto o servicio" value={form.productOrService} onChange={value => update('productOrService', value)} required /><Input label="Monto reclamado (S/) — opcional" value={form.amount} onChange={value => update('amount', value)} type="number" min="0" step="0.01" /><Input label="Número de pedido — opcional" value={form.orderNumber} onChange={value => update('orderNumber', value)} /></fieldset>
          <div className="mt-5 grid gap-5"><Textarea label="Detalle" value={form.detail} onChange={value => update('detail', value)} required /><Textarea label="Pedido de la persona consumidora" value={form.request} onChange={value => update('request', value)} required /></div>
          {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
          <button disabled={sending} className="mt-8 w-full rounded-xl bg-[#8B5A5A] px-6 py-4 font-bold text-white transition hover:bg-[#744848] disabled:cursor-not-allowed disabled:opacity-60">{sending ? 'Registrando…' : 'Registrar solicitud'}</button>
        </form>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required, inputMode, min, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; inputMode?: 'tel'; min?: string; step?: string }) {
  return <label className="text-sm font-bold text-gray-700">{label}<input type={type} value={value} min={min} step={step} inputMode={inputMode} onChange={e => onChange(e.target.value)} required={required} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#8B5A5A]" /></label>;
}
function Textarea({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="text-sm font-bold text-gray-700">{label}<textarea value={value} onChange={e => onChange(e.target.value)} required={required} rows={4} className="mt-2 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#8B5A5A]" /></label>;
}
