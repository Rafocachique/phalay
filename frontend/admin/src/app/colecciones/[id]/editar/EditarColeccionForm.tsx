'use client';

import { updateCollection } from '@/app/actions/collections';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { ChevronLeft, Save } from 'lucide-react';

interface EditarColeccionFormProps {
  collection: any;
}

export default function EditarColeccionForm({ collection }: EditarColeccionFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState(collection.imageUrl || '');

  async function clientAction(formData: FormData) {
    setSubmitting(true);
    formData.set('imageUrl', imageUrl);

    const result = await updateCollection(collection.id, formData);
    setSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Colección actualizada exitosamente');
      router.push('/colecciones');
      router.refresh();
    }
  }

  return (
    <div className="animate-enter max-w-4xl mx-auto pb-12">
      <form action={clientAction}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/colecciones" className="hover:text-gray-900 flex items-center gap-1 font-medium">
                <ChevronLeft size={14} /> Colecciones
              </Link>
              <span>/</span>
              <span className="font-semibold text-gray-800">Editar Colección</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Editar Colección</h1>
          </div>
          
          <button 
            type="submit" 
            disabled={submitting}
            className="bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <Save size={18} />
            {submitting ? 'Guardando...' : 'Guardar Colección'}
          </button>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Nombre de la Colección</label>
            <input 
              type="text" 
              name="name" 
              required 
              defaultValue={collection.name}
              placeholder="Ej. Otoño/Invierno 2026" 
              className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Descripción</label>
            <div className="bg-[#F8F9FA] border border-transparent focus-within:bg-white focus-within:border-[#8B5A5A] rounded-xl overflow-hidden transition-colors">
              <textarea 
                name="description" 
                rows={4} 
                defaultValue={collection.description || ''}
                placeholder="Describe la temática de esta colección..." 
                className="w-full bg-transparent border-none p-4 outline-none text-gray-900 resize-none text-sm"
              ></textarea>
            </div>
          </div>

          <ImageUpload
            name="imageUrl"
            label="Imagen de Portada de la Colección"
            currentUrl={imageUrl}
            onUrlChange={setImageUrl}
          />
        </div>
      </form>
    </div>
  );
}
