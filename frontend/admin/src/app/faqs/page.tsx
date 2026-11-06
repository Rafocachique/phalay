'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Info, Plus, Trash2 } from 'lucide-react';
import { getFaqs, createFaq, deleteFaq } from '@/app/actions/faqs';

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  useEffect(() => {
    getFaqs()
      .then(data => setFaqs(data))
      .catch(() => toast.error('Error al cargar FAQs'))
      .finally(() => setLoading(false));
  }, []);

  const submitNewFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaq.question || !newFaq.answer) return;

    const result = await createFaq(newFaq);
    if ('success' in result && result.success) {
      setFaqs([...faqs, result.data]);
      setNewFaq({ question: '', answer: '' });
      setIsAddingFaq(false);
      toast.success('Pregunta añadida');
    } else {
      toast.error('error' in result ? result.error : 'Error al añadir FAQ');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta pregunta?')) return;
    const result = await deleteFaq(id);
    if ('success' in result && result.success) {
      setFaqs(faqs.filter(f => f.id !== id));
      toast.success('Pregunta eliminada');
    } else {
      toast.error('error' in result ? result.error : 'Error al eliminar FAQ');
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500 font-bold">Cargando preguntas frecuentes...</div>;

  return (
    <div className="animate-enter w-full space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Preguntas Frecuentes</h1>
        <p className="text-sm text-gray-500 mt-2">Gestiona las dudas y consultas más comunes de tus clientas.</p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#FBEFEF] text-[#8B5A5A] rounded-lg flex items-center justify-center">
              <Info size={18} />
            </span>
            Preguntas Frecuentes (FAQ)
          </h2>
          {!isAddingFaq && (
            <button onClick={() => setIsAddingFaq(true)} className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-bold transition-colors">
              <Plus size={16} /> Agregar FAQ
            </button>
          )}
        </div>
        
        {isAddingFaq && (
          <form onSubmit={submitNewFaq} className="bg-gray-50 p-6 rounded-2xl mb-6 border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Pregunta</label>
              <input 
                type="text" 
                value={newFaq.question}
                onChange={e => setNewFaq({...newFaq, question: e.target.value})}
                required
                placeholder="Ej. ¿Cuánto tardan los envíos?" 
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#8B5A5A] outline-none text-gray-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Respuesta</label>
              <textarea 
                value={newFaq.answer}
                onChange={e => setNewFaq({...newFaq, answer: e.target.value})}
                required
                rows={3}
                placeholder="Ej. Los envíos tardan entre 2 y 4 días hábiles..." 
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#8B5A5A] outline-none text-gray-900 resize-none"
              ></textarea>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setIsAddingFaq(false)} className="px-6 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="bg-[#8B5A5A] hover:bg-[#A87474] text-white px-6 py-2 rounded-xl font-bold transition-colors">
                Guardar Pregunta
              </button>
            </div>
          </form>
        )}

        {faqs.length === 0 && !isAddingFaq ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
            Aún no has agregado preguntas frecuentes.
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{faq.question}</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{faq.answer}</p>
                </div>
                <button 
                  onClick={() => handleDeleteFaq(faq.id)} 
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
