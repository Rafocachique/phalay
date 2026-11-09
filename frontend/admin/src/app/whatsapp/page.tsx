'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3, MessageCircle, PauseCircle, Plus, RefreshCw, Send, Settings2, UserRoundCheck, UsersRound } from 'lucide-react';
import { WaAccount, WaConversation, WaMessage, WaStatus, whatsappAccounts, whatsappAccountBotMode, whatsappConversations, whatsappCreateAccount, whatsappMessages, whatsappMode, whatsappProcess, whatsappReply, whatsappStatus, whatsappAssignAdmin } from '@/app/actions/whatsapp';
import { getUsers } from '@/app/actions/users';

const conversationLabels = { BOT: 'Atención automática', WAITING: 'En espera del equipo', HUMAN: 'Atención del equipo' };
const messageStates: Record<string, string> = { QUEUED: 'Pendiente de respuesta', PROCESSING: 'Preparando respuesta', RECEIVED: 'Recibido', SENDING: 'Envío en curso', SENT: 'Enviado', UNKNOWN: 'Revisar envío', REVIEW: 'Requiere revisión' };
const accountModes = {
  BOT: { label: 'Atención automática', icon: CheckCircle2 },
  MANUAL: { label: 'Atención manual', icon: UserRoundCheck },
  PAUSED: { label: 'Atención en pausa', icon: PauseCircle },
} as const;

export default function WhatsappPage() {
  const [status, setStatus] = useState<WaStatus>();
  const [conversations, setConversations] = useState<WaConversation[]>([]);
  const [accounts, setAccounts] = useState<WaAccount[]>([]);
  const [accountName, setAccountName] = useState('');
  const [admins, setAdmins] = useState<{ id: string; firstName: string; lastName: string; role: string }[]>([]);
  const [adminByAccount, setAdminByAccount] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string>();
  const selectedRef = useRef<string | undefined>(undefined);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const conversation = conversations.find((item) => item.id === selected);

  const refresh = useCallback(async () => {
    const result = await whatsappStatus();
    if (!result.data) { setError(result.error || 'No se pudo consultar la configuración'); return; }
    setStatus(result.data);
    const connected = await whatsappAccounts();
    if (connected.data) setAccounts(connected.data);
    if (!result.data.databaseReady || !result.data.phoneConfigured) return;
    const list = await whatsappConversations();
    if (list.data) setConversations(list.data);
    else setError(list.error || 'No se pudieron cargar las conversaciones');
  }, []);

  useEffect(() => {
    void refresh();
    void getUsers().then((items) => setAdmins(items.filter((item: any) => ['ADMIN', 'SUPER_ADMIN'].includes(item.role))));
  }, [refresh]);

  async function open(id: string) {
    selectedRef.current = id;
    setSelected(id); setBody(''); setMessages([]); setError(''); setNotice('');
    const result = await whatsappMessages(id);
    if (selectedRef.current !== id) return;
    if (result.data) setMessages(result.data.slice().reverse());
    else setError(result.error || 'No se pudieron cargar los mensajes');
  }

  async function changeConversationMode(value: 'BOT' | 'HUMAN') {
    if (!selected || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await whatsappMode(selected, value);
      if (result.error) setError(result.error);
      else setNotice(value === 'HUMAN' ? 'La conversación está asignada a tu atención.' : 'La atención automática fue reactivada para esta conversación.');
      await refresh();
    } finally { setBusy(false); }
  }

  async function send(event: FormEvent) {
    event.preventDefault(); if (!selected || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await whatsappReply(selected, body);
      if (result.error) { setError(result.error); return; }
      setBody(''); const history = await whatsappMessages(selected);
      if (history.data) setMessages(history.data.slice().reverse());
      await refresh();
    } finally { setBusy(false); }
  }

  async function process() {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await whatsappProcess();
      if (result.error) setError(result.error);
      else setNotice(result.data?.enabled ? `Se revisó la atención pendiente: ${result.data.processed} conversación(es).` : 'La atención automática está pausada a nivel general.');
      await refresh();
      if (selected) { const history = await whatsappMessages(selected); if (history.data) setMessages(history.data.slice().reverse()); }
    } finally { setBusy(false); }
  }

  async function createAccount(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await whatsappCreateAccount(accountName);
      if (result.error) setError(result.error);
      else { setAccountName(''); setNotice('Canal creado. Quedará listo para vincularse cuando Meta habilite el QR oficial.'); await refresh(); }
    } finally { setBusy(false); }
  }

  async function accountMode(id: string, mode: WaAccount['bot_mode']) {
    if (busy) return; setBusy(true); setError(''); setNotice('');
    try { const result = await whatsappAccountBotMode(id, mode); if (result.error) setError(result.error); else setNotice('Preferencia de atención actualizada para este canal.'); await refresh(); }
    finally { setBusy(false); }
  }

  async function assignAdmin(accountId: string) {
    const userId = adminByAccount[accountId]; if (!userId || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await whatsappAssignAdmin(accountId, userId);
      if (result.error) setError(result.error);
      else { setNotice('Administrador asignado. Ambos podrán atender las mismas conversaciones.'); setAdminByAccount((value) => ({ ...value, [accountId]: '' })); await refresh(); }
    } finally { setBusy(false); }
  }

  const ready = !!status?.databaseReady && !!status?.phoneConfigured;
  return <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FAE8E8] text-[#8B5A5A]"><MessageCircle size={23} strokeWidth={2.3} /></span><div><h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Centro de atención</h1><p className="mt-1 text-sm text-gray-500">Gestiona los canales de WhatsApp y las conversaciones del equipo.</p></div></div>
      <div className="flex flex-wrap gap-2"><button onClick={() => { void refresh(); if (selected) void open(selected); }} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"><RefreshCw size={16} />Actualizar</button><button onClick={process} disabled={busy || !ready || !status?.botEnabled} className="inline-flex items-center gap-2 rounded-xl bg-[#8B5A5A] px-3.5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#724747] disabled:cursor-not-allowed disabled:bg-gray-300"><Clock3 size={16} />Revisar pendientes</button></div>
    </header>

    <section className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm"><span className="inline-flex items-center gap-2 font-semibold text-gray-700"><span className={`h-2 w-2 rounded-full ${status?.webhookConfigured ? 'bg-emerald-500' : 'bg-amber-400'}`} />Conexión {status?.webhookConfigured ? 'preparada' : 'pendiente'}</span><span className="text-gray-400">|</span><span className="text-gray-600">Canales: <strong className="font-semibold text-gray-800">{accounts.length}</strong></span><span className="text-gray-400">|</span><span className="text-gray-600">Atención automática: <strong className="font-semibold text-gray-800">{status?.botEnabled ? 'activa' : 'en pausa'}</strong></span></section>

    <div aria-live="polite" className="space-y-3">{error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}{notice && <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</p>}</div>

    <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:sticky xl:top-24">
        <div className="border-b border-gray-100 p-4"><div className="flex items-center gap-2"><Settings2 size={18} className="text-[#8B5A5A]" /><h2 className="font-bold text-gray-900">Canales de atención</h2></div><p className="mt-1 text-xs leading-5 text-gray-500">Selecciona cómo atiende cada cuenta y quién puede verla.</p></div>
        <form onSubmit={createAccount} className="border-b border-gray-100 p-3"><label htmlFor="new-channel" className="sr-only">Nombre del canal</label><div className="flex gap-2"><input id="new-channel" value={accountName} onChange={(event) => setAccountName(event.target.value)} maxLength={120} required placeholder="Nombre del canal" className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-[#A87474] focus:bg-white focus:ring-2 focus:ring-[#FAE8E8]" /><button type="submit" disabled={busy} aria-label="Agregar canal" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5A5A] text-white transition hover:bg-[#724747] disabled:opacity-50"><Plus size={19} /></button></div></form>
        <div className="max-h-[560px] space-y-2 overflow-auto p-3">{!accounts.length && <div className="rounded-xl bg-gray-50 px-3 py-5 text-center"><MessageCircle className="mx-auto text-gray-300" size={24} /><p className="mt-2 text-sm font-semibold text-gray-600">Aún no hay canales</p><p className="mt-1 text-xs leading-5 text-gray-500">Crea uno para preparar su conexión oficial.</p></div>}
          {accounts.map((account) => { const currentMode = accountModes[account.bot_mode]; const ModeIcon = currentMode.icon; return <article key={account.id} className="rounded-xl border border-gray-200 p-3 transition hover:border-[#D9B0AE]"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-bold text-gray-900">{account.display_name}</p><p className="mt-0.5 text-xs text-gray-500">{account.phone_number_id ? 'Número conectado' : 'Conexión pendiente'}</p></div><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">{account.status}</span></div><div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-gray-600"><ModeIcon size={14} className="text-[#8B5A5A]" />{currentMode.label}<span className="mx-1 text-gray-300">·</span><UsersRound size={14} />{account.member_count || 1}</div>{account.permission === 'MANAGE' && <><div className="mt-3 grid grid-cols-3 gap-1">{(Object.keys(accountModes) as WaAccount['bot_mode'][]).map((mode) => <button key={mode} type="button" disabled={busy} onClick={() => void accountMode(account.id, mode)} className={`rounded-lg px-1 py-1.5 text-[10px] font-bold transition ${account.bot_mode === mode ? 'bg-[#8B5A5A] text-white' : 'bg-gray-50 text-gray-600 hover:bg-[#FAE8E8]'} disabled:opacity-50`}>{mode === 'BOT' ? 'Automática' : mode === 'MANUAL' ? 'Manual' : 'Pausa'}</button>)}</div><div className="mt-2 flex gap-1.5"><select aria-label={`Asignar administrador a ${account.display_name}`} value={adminByAccount[account.id] || ''} onChange={(event) => setAdminByAccount((value) => ({ ...value, [account.id]: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 outline-none"><option value="">Compartir con…</option>{admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.firstName} {admin.lastName}</option>)}</select><button type="button" onClick={() => void assignAdmin(account.id)} disabled={busy || !adminByAccount[account.id]} className="rounded-lg border border-gray-200 px-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Asignar</button></div></>}</article>; })}
        </div>
      </aside>

      <section className="min-h-[650px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4"><div><h2 className="font-bold text-gray-900">Conversaciones</h2><p className="mt-0.5 text-xs text-gray-500">Solo se muestran los canales a los que tienes acceso.</p></div>{status && !ready && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">Falta vincular un número</span>}</div>
        <div className="grid min-h-[580px] md:grid-cols-[280px_minmax(0,1fr)]"><aside className="border-b border-gray-100 bg-gray-50/60 p-3 md:border-b-0 md:border-r"><h3 className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Bandeja</h3>{!conversations.length && <div className="px-2 py-8 text-center"><MessageCircle className="mx-auto text-gray-300" size={26} /><p className="mt-3 text-sm font-medium text-gray-500">Aún no hay conversaciones</p><p className="mt-1 text-xs leading-5 text-gray-400">Aparecerán aquí cuando llegue el primer mensaje.</p></div>}<div className="space-y-1">{conversations.map((item) => <button key={item.id} disabled={busy} onClick={() => void open(item.id)} className={`w-full rounded-xl px-3 py-3 text-left transition ${selected === item.id ? 'bg-white shadow-sm ring-1 ring-[#D9B0AE]' : 'hover:bg-white'}`}><span className="block font-bold text-gray-800">+{item.customer_wa_id}</span><span className="mt-1 block text-xs text-gray-500">{conversationLabels[item.mode]}</span></button>)}</div></aside>
          <div className="flex min-w-0 flex-col p-4 sm:p-5">{!conversation ? <div className="flex flex-1 flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAE8E8] text-[#8B5A5A]"><MessageCircle size={25} /></span><h3 className="mt-4 font-bold text-gray-800">Selecciona una conversación</h3><p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">Desde aquí podrás continuar la atención y revisar el historial de cada cliente.</p></div> : <><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-gray-900">+{conversation.customer_wa_id}</h3><p className="mt-1 text-xs font-medium text-gray-500">{conversationLabels[conversation.mode]}</p></div><div className="flex gap-2"><button disabled={busy} onClick={() => void changeConversationMode('HUMAN')} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Tomar atención</button><button disabled={busy || conversation.mode === 'BOT'} onClick={() => void changeConversationMode('BOT')} className="rounded-xl bg-[#FAE8E8] px-3 py-2 text-xs font-bold text-[#8B5A5A] transition hover:bg-[#F3D8D7] disabled:opacity-50">Reactivar atención automática</button></div></div><div className="mt-5 flex-1 space-y-3 overflow-auto rounded-2xl bg-gray-50 p-3 sm:p-4">{!messages.length && <p className="py-8 text-center text-sm text-gray-500">No hay mensajes para mostrar.</p>}{messages.map((item) => <div key={item.id} className={`max-w-xl rounded-2xl border px-4 py-3 shadow-sm ${item.direction === 'OUT' ? 'ml-auto border-[#D4E7D8] bg-[#F0FAF2]' : 'border-gray-200 bg-white'}`}><p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">{item.body}</p><p className="mt-2 text-[11px] font-medium text-gray-400">{item.direction === 'IN' ? 'Cliente' : 'Equipo de atención'} · {messageStates[item.state] || item.state}</p></div>)}</div><form onSubmit={send} className="mt-4"><label htmlFor="wa-reply" className="sr-only">Respuesta del equipo</label><div className="flex gap-2"><textarea id="wa-reply" value={body} onChange={(event) => setBody(event.target.value)} required maxLength={4096} rows={2} disabled={busy || conversation.mode !== 'HUMAN'} className="min-h-[48px] flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#A87474] focus:ring-2 focus:ring-[#FAE8E8] disabled:bg-gray-50" placeholder={conversation.mode === 'HUMAN' ? 'Escribe una respuesta…' : 'Toma la conversación para responder'} /><button aria-label="Enviar respuesta" disabled={busy || conversation.mode !== 'HUMAN' || !body.trim()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl bg-[#8B5A5A] text-white transition hover:bg-[#724747] disabled:cursor-not-allowed disabled:bg-gray-300"><Send size={18} /></button></div></form></>}</div>
        </div></section>
    </div>
  </main>;
}
