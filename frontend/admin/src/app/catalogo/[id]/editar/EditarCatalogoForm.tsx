'use client';

import { updateCatalogo } from '@/app/actions/catalog';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function EditarCatalogoForm({ catalogo }: { catalogo: any }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(catalogo.imageUrl || '');

  async function clientAction(formData: FormData) {
    formData.set('imageUrl', imageUrl);
    const result = await updateCatalogo(catalogo.id, formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Tipo de Prenda actualizado exitosamente');
      router.push('/catalogo');
    }
  }

  return (
    <form action={clientAction}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex gap-2 text-sm text-gray-500 mb-1">
            <Link href="/catalogo" className="hover:text-gray-900 flex items-center gap-1 font-medium">
              <ChevronLeft size={14} /> Catálogo
            </Link>
            <span>/</span>
            <span>Editar Tipo de Prenda</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900">Editar Catálogo</h1>
        </div>
        <button type="submit" className="bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm">
          Guardar Cambios
        </button>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Nombre del Tipo de Prenda</label>
            <input 
              type="text" 
              name="name" 
              required 
              defaultValue={catalogo.name}
              placeholder="Ej. Vestidos, Knitwear" 
              className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Descripción (Opcional)</label>
            <div className="bg-[#F8F9FA] border border-transparent focus-within:bg-white focus-within:border-[#8B5A5A] rounded-xl overflow-hidden transition-colors">
              <textarea 
                name="description" 
                rows={4} 
                defaultValue={catalogo.description || ''}
                placeholder="Describe brevemente este estilo..." 
                className="w-full bg-transparent border-none p-4 outline-none text-gray-900 resize-none"
              ></textarea>
            </div>
          </div>

          <ImageUpload
            name="imageUrl"
            label="Imagen de Portada"
            onUrlChange={setImageUrl}
            currentUrl={catalogo.imageUrl}
          />
        </div>
      </div>
    </form>
  );
}
