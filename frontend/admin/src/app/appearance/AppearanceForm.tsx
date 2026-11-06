'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateStoreAppearance } from '@/app/actions/store';
import { LayoutTemplate } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

export default function AppearanceForm({ initialBannerUrl, initialTitle, initialSubtitle }: { initialBannerUrl: string, initialTitle: string, initialSubtitle: string }) {
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl);

  async function clientAction(formData: FormData) {
    // Inject the image URL (in case it was uploaded instead of typed)
    formData.set('bannerUrl', bannerUrl);
    const result = await updateStoreAppearance(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Apariencia actualizada correctamente');
    }
  }

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <LayoutTemplate className="text-gray-400" size={24} /> Banner Principal (Hero)
      </h2>

      <form action={clientAction} className="space-y-6">
        <div className="bg-[#FFFDF9] border border-[#FBEFEF] rounded-2xl p-5 flex gap-4 text-sm text-[#8B5A5A] animate-enter">
          <span className="text-xl">💡</span>
          <div>
            <p className="font-bold text-gray-900 mb-1 text-sm">Consejo de Diseño para tu Banner Portada:</p>
            <p className="text-gray-600 leading-relaxed text-xs">
              El banner principal se visualiza en formato horizontal panorámico (relación de aspecto <strong>21:9</strong> o <strong>1400x600 px</strong>). Para que tus fotos se vean perfectas sin cortar partes importantes (como rostros):
            </p>
            <ul className="list-disc pl-4 mt-2 space-y-1 text-xs text-gray-500">
              <li>Usa preferentemente imágenes <strong>horizontales amplias</strong>.</li>
              <li>Deja un margen o <strong>espacio libre en la parte superior</strong> de la foto.</li>
              <li>El storefront de la tienda centrará el encuadre en el <strong>tercio superior-medio (30% desde arriba)</strong> de forma automática para evitar cortes en rostros y cabezas.</li>
            </ul>
          </div>
        </div>

        <ImageUpload
          name="bannerUrl"
          label="Imagen del Banner"
          currentUrl={initialBannerUrl}
          onUrlChange={setBannerUrl}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Título del Banner</label>
            <input
              type="text"
              name="title"
              defaultValue={initialTitle}
              placeholder="Elegancia Redefinida"
              className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Subtítulo</label>
            <input
              type="text"
              name="subtitle"
              defaultValue={initialSubtitle}
              placeholder="Descubre nuestra nueva colección..."
              className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-medium"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            className="bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-sm"
          >
            Guardar Apariencia
          </button>
        </div>
      </form>
    </div>
  );
}
