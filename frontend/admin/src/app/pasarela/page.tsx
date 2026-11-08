'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, CreditCard, LockKeyhole, RefreshCw } from 'lucide-react';
import { getPaymentGatewayStatus } from '@/app/actions/store';

type GatewayStatus = {
  provider: string;
  mode: 'TEST' | 'PRODUCTION' | 'UNCONFIGURED';
  secretKeyConfigured: boolean;
  publicKeyConfigured: boolean;
  webhookConfigured: boolean;
  error?: string;
};

export default function PasarelaPage() {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const load = () => { setStatus(null); getPaymentGatewayStatus().then(setStatus); };
  useEffect(load, []);

  if (!status) return <div className="flex h-64 items-center justify-center"><RefreshCw className="animate-spin text-[#8B5A5A]" size={32} /></div>;
  if (status.error) return <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">{status.error}</div>;
  const ready = status.mode !== 'UNCONFIGURED' && status.secretKeyConfigured && status.publicKeyConfigured;
  const Item = ({ label, ok }: { label: string; ok: boolean }) => <div className="flex items-center gap-3 rounded-xl bg-[#F8F9FA] p-4 text-sm font-semibold text-gray-700">{ok ? <CheckCircle2 size={18} className="text-green-600" /> : <CircleAlert size={18} className="text-amber-600" />}{label}<span className={`ml-auto text-xs font-bold ${ok ? 'text-green-700' : 'text-amber-700'}`}>{ok ? 'Listo' : 'Falta configurar'}</span></div>;
  return <div className="animate-enter mx-auto max-w-4xl space-y-8 pb-12">
    <div><h1 className="text-4xl font-black text-gray-900">Pasarela de pagos</h1><p className="mt-2 text-sm text-gray-500">Acceso exclusivo del Super Administrador. Las claves privadas nunca se muestran ni se guardan en la base de datos.</p></div>
    <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-4"><div className="rounded-2xl bg-[#FBEFEF] p-3 text-[#8B5A5A]"><CreditCard size={26} /></div><div><h2 className="text-xl font-bold">Culqi</h2><p className="mt-1 text-sm text-gray-500">Estado de la conexión del servidor.</p></div></div><span className={`rounded-full px-4 py-2 text-xs font-black ${status.mode === 'TEST' ? 'bg-blue-100 text-blue-700' : status.mode === 'PRODUCTION' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{status.mode === 'TEST' ? 'MODO PRUEBA' : status.mode === 'PRODUCTION' ? 'PRODUCCIÓN' : 'SIN CONFIGURAR'}</span></div>
      <div className="mt-7 grid gap-3"><Item label="Clave privada del servidor" ok={status.secretKeyConfigured} /><Item label="Clave pública del checkout" ok={status.publicKeyConfigured} /><Item label="Secreto del webhook" ok={status.webhookConfigured} /></div>
      <button onClick={load} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"><RefreshCw size={15} /> Actualizar estado</button>
    </section>
    <section className="rounded-[2rem] border border-[#8B5A5A]/15 bg-[#FBF5F5] p-8"><div className="flex gap-3"><LockKeyhole className="mt-0.5 text-[#8B5A5A]" size={20} /><div><h2 className="font-bold text-gray-900">Cómo cambiar entre prueba y producción</h2><p className="mt-2 text-sm leading-6 text-gray-600">Cambia las variables protegidas del proyecto <strong>phalay-api</strong> en Vercel y vuelve a desplegar una sola vez. Para pruebas usa las llaves <code>pk_test_…</code> y <code>sk_test_…</code>; para producción usa las llaves aprobadas <code>pk_live_…</code> y <code>sk_live_…</code>.</p><p className="mt-3 text-sm leading-6 text-gray-600">Variables requeridas: <code>NEXT_PUBLIC_CULQI_PUBLIC_KEY</code>, <code>CULQI_SECRET_KEY</code> y <code>CULQI_WEBHOOK_SECRET</code>. No pegues claves aquí, en el navegador ni en el repositorio.</p>{!ready && <p className="mt-3 text-sm font-bold text-amber-700">El cobro automático debe permanecer desactivado hasta que las tres configuraciones aparezcan como listas.</p>}</div></div></section>
  </div>;
}
