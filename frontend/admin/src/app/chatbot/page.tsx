'use client';

import { FormEvent, useState } from 'react';
import { BotPreview, previewChatbot } from '@/app/actions/chatbot';

const labels = { answer: 'Respuesta aprobada', clarify: 'Pedir aclaración', handoff: 'Requiere vendedor', paused: 'Bot en pausa' };

export default function ChatbotPage() {
  const [message, setMessage] = useState('');
  const [humanActive, setHumanActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BotPreview>();
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setResult(undefined);
    try {
      const response = await previewChatbot(message, humanActive);
      if (response.error) setError(response.error);
      else setResult(response.data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Asistente de PHALAY</h1>
        <p className="mt-2 text-gray-600">Prueba respuestas de la base de conocimiento antes de habilitar la atención a clientes.</p>
        <p className="mt-2 text-sm text-gray-600">Usa las preguntas frecuentes activas de tu tienda. Puedes editarlas en <a href="/faqs" className="underline">Preguntas Frecuentes</a>.</p>
      </div>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Esta es una prueba interna. No envía mensajes a WhatsApp ni asigna conversaciones a vendedores.
      </p>
      <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-5">
        <label htmlFor="bot-question" className="block font-medium">Consulta del cliente</label>
        <textarea id="bot-question" value={message} onChange={(event) => setMessage(event.target.value)}
          required maxLength={2000} rows={4} className="w-full rounded-lg border p-3"
          placeholder="Por ejemplo: ¿Qué vende PHALAY?" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={humanActive} onChange={(event) => setHumanActive(event.target.checked)} />
          Simular que un vendedor ya está atendiendo
        </label>
        <button type="submit" disabled={busy || !message.trim()} className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50">
          {busy ? 'Consultando…' : 'Probar respuesta'}
        </button>
      </form>
      <div aria-live="polite">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
        {result && <section className="space-y-3 rounded-xl border bg-white p-5">
          <h2 className="font-semibold">{labels[result.action]}</h2>
          <p className="whitespace-pre-wrap">{result.answer || 'El bot no responde mientras atiende el vendedor.'}</p>
          {result.suggestions.length > 0 && <ul className="list-inside list-disc">{result.suggestions.map((item) => <li key={item}>{item}</li>)}</ul>}
          {result.sources.length > 0 && <p className="text-sm text-gray-500">Artículos utilizados: {result.sources.join(', ')}</p>}
        </section>}
      </div>
    </main>
  );
}
