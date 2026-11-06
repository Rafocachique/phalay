import AppearanceForm from './AppearanceForm';
import { Image as ImageIcon } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getStore() {
  try {
    const res = await fetch(`${API_BASE_URL}/stores`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export default async function AppearancePage() {
  const store = await getStore();
  
  const defaultBanner = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80';
  const defaultTitle = 'Elegancia Redefinida';
  const defaultSubtitle = 'Descubre nuestra nueva colección de primavera diseñada para la mujer moderna que busca exclusividad y sofisticación.';
  
  const bannerUrl = store?.bannerUrl || defaultBanner;
  const branding = store?.branding || {};
  const title = branding.heroTitle || defaultTitle;
  const subtitle = branding.heroSubtitle || defaultSubtitle;

  return (
    <div className="animate-enter w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Apariencia de la Tienda</h1>
        <p className="text-sm text-gray-500 mt-2">Personaliza los banners, imágenes principales y el look & feel de tu e-commerce.</p>
      </div>

      <AppearanceForm 
        initialBannerUrl={bannerUrl}
        initialTitle={title}
        initialSubtitle={subtitle}
      />

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 mb-8 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ImageIcon className="text-gray-400" size={24} /> Imágenes de Colecciones
        </h2>
        <p className="text-sm text-gray-500 mb-6">Ve a la sección "Colecciones" en el menú izquierdo para actualizar las imágenes destacadas de tus colecciones. Se sincronizarán automáticamente en la tienda.</p>
      </div>
    </div>
  );
}
