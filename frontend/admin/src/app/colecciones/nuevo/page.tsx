'use client';

import { createCollection } from '@/app/actions/collections';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import { useState } from 'react';

export default function NuevaColeccionPage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState('');

  async function clientAction(formData: FormData) {
    formData.set('imageUrl', imageUrl);
    const result = await createCollection(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Colección creada exitosamente');
      router.push('/colecciones');
    }
  }

  return (
    <div className="animate-enter w-full">
      <form action={clientAction}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <div className="flex gap-2 text-sm text-gray-500 mb-1">
              <Link href="/colecciones" className="hover:text-gray-900">Colecciones</Link>
              <span>/</span>
              <span>Nueva Colección</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900">Crear Colección</h1>
          </div>
          <button type="submit" className="bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-sm">
            Guardar Colección
          </button>
        </div>

        {/* Tip / Sizing info */}
        <div className="bg-[#FAF6F6] border border-[#8B5A5A]/15 rounded-[1.5rem] p-5 mb-8 flex gap-4 items-start shadow-sm">
          <div className="bg-[#8B5A5A] text-white p-2 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold font-mono">Tip</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#4A3E38] mb-1">Distribución de Colecciones en la Portada:</h4>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              La <strong>primera colección</strong> creada se mostrará como la destacada principal (gran tamaño), y las <strong>siguientes tres</strong> completarán la cuadrícula lateral. Sube una foto atractiva y de buen tamaño para la portada de tu tienda.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Nombre de la Colección</label>
              <input 
                type="text" 
                name="name" 
                required 
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
                  placeholder="Describe la temática de esta colección..." 
                  className="w-full bg-transparent border-none p-4 outline-none text-gray-900 resize-none"
                ></textarea>
              </div>
            </div>

            <ImageUpload
              name="imageUrl"
              label="Imagen de la Colección"
              onUrlChange={setImageUrl}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
