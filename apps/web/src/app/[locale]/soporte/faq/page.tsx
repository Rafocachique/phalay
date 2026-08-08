'use client';

import { useState, useEffect } from 'react';


const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    return `http://${hostname}:4000/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/stores/faqs?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        // La API devuelve { value: [...], Count: N } o directamente un array
        const list = Array.isArray(data) ? data : (data.value || []);
        setFaqs(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-black text-gray-900 mb-4 text-center">Preguntas Frecuentes</h1>
        <p className="text-gray-500 text-center mb-12">Encuentra respuestas rápidas a las consultas más comunes.</p>

        {loading ? (
          <div className="text-center py-12">Cargando preguntas frecuentes...</div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            Aún no hay preguntas frecuentes publicadas.
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
