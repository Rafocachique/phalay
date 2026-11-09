'use client';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { WaAccount, WaConversation, WaMessage, WaStatus, whatsappAccounts, whatsappAccountBotMode, whatsappConversations, whatsappCreateAccount, whatsappMessages, whatsappMode,
  whatsappProcess, whatsappReply, whatsappStatus, whatsappAssignAdmin } from '@/app/actions/whatsapp';
import { getUsers } from '@/app/actions/users';

const modes = { BOT: 'Bot', WAITING: 'Espera vendedor', HUMAN: 'Atención humana' };
const states: Record<string, string> = { QUEUED: 'Pendiente del bot', PROCESSING: 'Procesando', RECEIVED: 'Recibido',
  SENDING: 'Envío en curso; comprobar recepción', SENT: 'Aceptado por Meta', UNKNOWN: 'Envío sin confirmar: revisar WhatsApp antes de repetir', REVIEW: 'Requiere revisión' };

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
    else setError(list.error || 'No se pudieron cargar conversaciones');
  }, []);

  useEffect(() => { void refresh(); void getUsers().then((items) => setAdmins(items.filter((item: any) => ['ADMIN', 'SUPER_ADMIN'].includes(item.role)))); }, [refresh]);

  async function open(id: string) {
    selectedRef.current = id;
    setSelected(id); setBody(''); setMessages([]); setError(''); setNotice('');
    const result = await whatsappMessages(id);
    if (selectedRef.current !== id) return;
    if (result.data) setMessages(result.data.slice().reverse());
    else setError(result.error || 'No se pudieron cargar los mensajes');
  }

  async function mode(value: 'BOT' | 'HUMAN') {
    if (!selected || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await whatsappMode(selected, value);
      if (result.error) setError(result.error);
      await refresh();
    } finally { setBusy(false); }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await whatsappReply(selected, body);
      if (result.error) { setError(result.error); return; }
      setBody('');
      const history = await whatsappMessages(selected);
      if (history.data) setMessages(history.data.slice().reverse());
      await refresh();
    } finally { setBusy(false); }
  }

  async function process() {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await whatsappProcess();
      if (result.error) setError(result.error);
      else setNotice(result.data?.enabled ? `Mensajes procesados: ${result.data.processed}.` : 'La respuesta automática está desactivada.');
      await refresh();
      if (selected) {
        const history = await whatsappMessages(selected);
        if (history.data) setMessages(history.data.slice().reverse());
      }
    } finally { setBusy(false); }
  }

  async function createAccount(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { const result = await whatsappCreateAccount(accountName); if (result.error) setError(result.error); else { setAccountName(''); setNotice('Cuenta creada. Cuando Meta habilite el QR de coexistencia, podrás vincular su WhatsApp Business.'); await refresh(); } }
    finally { setBusy(false); }
  }

  async function accountMode(id: string, mode: WaAccount['bot_mode']) {
    if (busy) return; setBusy(true); setError(''); setNotice('');
    try { const result = await whatsappAccountBotMode(id, mode); if (result.error) setError(result.error); else { setNotice('Modo de atención actualizado para esta cuenta.'); await refresh(); } }
    finally { setBusy(false); }
  }
  async function assignAdmin(accountId: string) {
    const userId = adminByAccount[accountId]; if (!userId || busy) return;
    setBusy(true); setError(''); setNotice('');
    try { const result = await whatsappAssignAdmin(accountId, userId); if (result.error) setError(result.error); else { setNotice('Administrador asignado a esta cuenta. Ambos podrán atender la misma bandeja.'); setAdminByAccount((value) => ({ ...value, [accountId]: '' })); } }
    finally { setBusy(false); }
  }

  return <main className="space-y-5 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-3xl font-bold">WhatsApp</h1><p className="mt-1 text-gray-600">Conversaciones del número conectado a PHALAY.</p></div>
      <div className="flex gap-3"><button onClick={() => { void refresh(); if (selected) void open(selected); }} disabled={busy}
        className="rounded-lg border px-4 py-2 disabled:opacity-50">Actualizar</button>
        <button onClick={process} disabled={busy || !status?.databaseReady || !status?.phoneConfigured || !status?.botEnabled}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">Procesar un pendiente</button></div>
    </div>
    {status && <section className="rounded-xl border bg-white p-4 text-sm">
      <p>Recepción: {status.webhookConfigured ? 'Credenciales configuradas' : 'Faltan credenciales del webhook'} · Base de datos: {status.databaseReady ? 'Lista' : 'Pendiente de preparar'} · Número: {status.phoneConfigured ? 'Configurado' : 'Pendiente'}</p>
      <p className="mt-2">Envío: {status.sendConfigured ? 'Configurado' : 'Faltan credenciales'} · Bot automático: {status.botEnabled ? 'Habilitado' : 'Desactivado'} · Motor: {status.engineConfigured ? 'Configurado' : 'Pendiente'}</p>
      <p className="mt-2">Configura primero el número de prueba. <Link href="/chatbot" className="underline">Probar conocimiento</Link></p>
    </section>}
    <section className="rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Cuentas de WhatsApp</h2><p className="mt-1 text-sm text-gray-600">Una cuenta puede tener varios administradores asignados. Cada cuenta elige su propio modo de atención.</p></div>
        <form onSubmit={createAccount} className="flex gap-2"><input value={accountName} onChange={(event) => setAccountName(event.target.value)} maxLength={120} required placeholder="Ej.: WhatsApp de Ana" className="rounded-lg border px-3 py-2 text-sm" />
          <button disabled={busy} className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50">Agregar cuenta</button></form></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{!accounts.length && <p className="text-sm text-gray-500">Todavía no hay cuentas individuales configuradas.</p>}
          {accounts.map((account) => <article key={account.id} className="rounded-lg border p-3"><div className="flex justify-between gap-2"><div><p className="font-medium">{account.display_name}</p><p className="text-xs text-gray-500">{account.phone_number_id ? 'Número conectado' : 'Pendiente de QR de coexistencia'} · {account.permission === 'MANAGE' ? 'Puede gestionar' : 'Puede responder'} · {account.member_count || 1} administrador{(account.member_count || 1) === 1 ? '' : 'es'}</p></div><span className="text-xs font-medium text-gray-600">{account.status}</span></div>
          <div className="mt-3 flex flex-wrap gap-2">{(['BOT','MANUAL','PAUSED'] as const).map((mode) => <button key={mode} disabled={busy || account.permission === 'RESPOND'} onClick={() => void accountMode(account.id, mode)}
            className={`rounded border px-2 py-1 text-xs ${account.bot_mode === mode ? 'border-black bg-black text-white' : ''} disabled:opacity-50`}>{mode === 'BOT' ? 'Bot' : mode === 'MANUAL' ? 'Manual' : 'Pausado'}</button>)}</div>
          {account.permission === 'MANAGE' && <div className="mt-3 flex gap-2"><select value={adminByAccount[account.id] || ''} onChange={(event) => setAdminByAccount((value) => ({ ...value, [account.id]: event.target.value }))} className="min-w-0 flex-1 rounded border px-2 py-1 text-xs"><option value="">Asignar administrador…</option>{admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.firstName} {admin.lastName}</option>)}</select><button onClick={() => void assignAdmin(account.id)} disabled={busy || !adminByAccount[account.id]} className="rounded border px-2 py-1 text-xs disabled:opacity-50">Asignar</button></div>}</article>)}</div>
    </section>
    <div aria-live="polite">{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
      {notice && <p className="rounded-lg bg-blue-50 p-3 text-blue-900">{notice}</p>}</div>
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <aside className="space-y-2 rounded-xl border bg-white p-3">
        <h2 className="p-2 font-semibold">Últimas conversaciones</h2>
        {!conversations.length && <p className="p-2 text-sm text-gray-500">Todavía no hay mensajes recibidos. Debes conectar y verificar el webhook.</p>}
        {conversations.map((item) => <button key={item.id} disabled={busy} onClick={() => void open(item.id)}
          className={`w-full rounded-lg border p-3 text-left ${selected === item.id ? 'border-black bg-gray-50' : ''}`}>
          <span className="block font-medium">+{item.customer_wa_id}</span><span className="text-sm text-gray-600">{modes[item.mode]}</span>
        </button>)}
      </aside>
      <section className="space-y-4 rounded-xl border bg-white p-4">
        {!conversation ? <p className="text-gray-500">Selecciona una conversación.</p> : <>
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">+{conversation.customer_wa_id} · {modes[conversation.mode]}</h2>
            <div className="flex gap-2"><button disabled={busy} onClick={() => void mode('HUMAN')} className="rounded border px-3 py-2">Tomar conversación</button>
              <button disabled={busy || conversation.mode === 'BOT'} onClick={() => void mode('BOT')} className="rounded border px-3 py-2">Devolver al bot</button></div></div>
          <div className="max-h-[480px] space-y-3 overflow-auto rounded-lg bg-gray-50 p-3">
            {!messages.length && <p className="text-sm text-gray-500">No hay mensajes para mostrar.</p>}
            {messages.map((item) => <div key={item.id} className={`max-w-xl rounded-xl border p-3 ${item.direction === 'OUT' ? 'ml-auto bg-green-50' : 'bg-white'}`}>
              <p className="whitespace-pre-wrap break-words">{item.body}</p><p className="mt-2 text-xs text-gray-500">{item.direction === 'IN' ? 'Cliente' : 'PHALAY'} · {states[item.state] || item.state}</p>
            </div>)}
          </div>
          <form onSubmit={send} className="space-y-2"><label htmlFor="wa-reply" className="block text-sm font-medium">Respuesta del vendedor</label>
            <textarea id="wa-reply" value={body} onChange={(event) => setBody(event.target.value)} required maxLength={4096} rows={3}
              disabled={busy || conversation.mode !== 'HUMAN'} className="w-full rounded-lg border p-3" placeholder="Toma la conversación para responder" />
            <button disabled={busy || conversation.mode !== 'HUMAN' || !body.trim()} className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50">Enviar por WhatsApp</button>
          </form></>}
      </section>
    </div>
  </main>;
}
