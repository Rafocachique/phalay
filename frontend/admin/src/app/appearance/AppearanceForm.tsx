'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateStoreAppearance } from '@/app/actions/store';
import { LayoutTemplate } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

export default function AppearanceForm({ initialBannerUrl, initialTitle, initialSubtitle, initialBranding }: { initialBannerUrl: string, initialTitle: string, initialSubtitle: string, initialBranding: Record<string, any> }) {
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
          <label className="text-sm font-bold text-gray-900">Posición del texto
            <select name="textPosition" defaultValue={initialBranding.heroTextPosition || 'bottom-center'} className="mt-2 w-full rounded-xl bg-[#F8F9FA] px-4 py-3.5 font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#8B5A5A]"><option value="top-left">Arriba a la izquierda</option><option value="top-center">Arriba centrado</option><option value="center-left">Centro a la izquierda</option><option value="center">Centro</option><option value="center-right">Centro a la derecha</option><option value="bottom-left">Abajo a la izquierda</option><option value="bottom-center">Abajo centrado</option><option value="bottom-right">Abajo a la derecha</option></select>
          </label>
          <label className="text-sm font-bold text-gray-900">Estilo de letra
            <select name="fontStyle" defaultValue={initialBranding.heroFontStyle || 'serif'} className="mt-2 w-full rounded-xl bg-[#F8F9FA] px-4 py-3.5 font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#8B5A5A]"><option value="serif">Elegante serif</option><option value="sans">Moderna sans</option></select>
          </label>
          <label className="text-sm font-bold text-gray-900">Color del texto
            <input name="textColor" type="color" defaultValue={initialBranding.heroTextColor || '#ffffff'} className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] p-2" />
          </label>
          <label className="text-sm font-bold text-gray-900">Sombra del texto
            <select name="textShadow" defaultValue={initialBranding.heroTextShadow || 'soft'} className="mt-2 w-full rounded-xl bg-[#F8F9FA] px-4 py-3.5 font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#8B5A5A]"><option value="none">Sin sombra</option><option value="soft">Suave</option><option value="strong">Intensa</option></select>
          </label>
          <label className="text-sm font-bold text-gray-900 md:col-span-2">Oscurecer imagen para mejorar contraste
            <input name="overlayOpacity" type="range" min="0" max="70" step="5" defaultValue={initialBranding.heroOverlayOpacity ?? 25} className="mt-3 w-full accent-[#8B5A5A]" />
            <span className="mt-1 block text-xs font-normal text-gray-500">Úsalo si la foto es clara y el texto pierde legibilidad.</span>
          </label>
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
