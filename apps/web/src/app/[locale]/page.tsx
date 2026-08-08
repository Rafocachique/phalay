import Link from 'next/link';
import ColeccionesCarousel from '@/components/ColeccionesCarousel';
import NovedadesCarousel from '@/components/NovedadesCarousel';
import CategoriasCarousel from '@/components/CategoriasCarousel';

// Forzar que esta página NUNCA se guarde en caché - siempre datos frescos de la BD
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getStore() {
  try {
    const res = await fetch(`${API_BASE_URL}/stores`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/products?limit=5`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getCollections() {
  try {
    const res = await fetch(`${API_BASE_URL}/collections?limit=4`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const COLLECTION_FALLBACKS = [
  { id: 'c1', name: 'Edición Gala', description: 'Piezas únicas para momentos inolvidables.', imageUrl: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80' },
  { id: 'c2', name: 'Brillo Atelier', description: '', imageUrl: 'https://images.unsplash.com/photo-1434389678232-068305cbe040?w=400&q=80' },
  { id: 'c3', name: 'Línea Mística', description: '', imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400&q=80' },
  { id: 'c4', name: 'Colección Nude', description: '', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80' },
];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const store = await getStore();
  const dbCollections = await getCollections();
  const dbProducts = await getProducts();
  const dbCategories = await getCategories();
  const bannerUrl = store?.bannerUrl || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80';
  const branding = store?.branding || {};
  const title = branding.heroTitle || 'Elegancia Redefinida';
  const subtitle = branding.heroSubtitle || 'Descubre nuestra nueva colección de primavera diseñada para la mujer moderna.';

  const collections = dbCollections.length > 0 ? dbCollections : COLLECTION_FALLBACKS;

  return (
    <>
      {/* Hero Section - Edge to Edge, Full Width, h-auto to show the full uncropped image */}
      <section className="relative w-full overflow-hidden bg-white">
        <div className="relative w-full">
          <img src={bannerUrl} alt="Hero" className="w-full h-auto block" />
          <div className="absolute inset-0 bg-black/25"></div>
          {/* Text and square button overlaid directly at the bottom area of the image */}
          <div className="absolute inset-0 flex flex-col justify-end pb-8 md:pb-16 lg:pb-24 items-center">
            <div className="text-center max-w-2xl px-6 animate-enter">
              <h1 className="text-2xl md:text-5xl lg:text-6xl font-serif text-white mb-2 md:mb-4 uppercase tracking-widest font-semibold drop-shadow-md leading-tight">{title}</h1>
              <p className="text-white/95 text-[10px] md:text-xs lg:text-sm mb-4 md:mb-6 lg:mb-8 font-medium drop-shadow-sm uppercase tracking-widest leading-relaxed max-w-lg mx-auto">{subtitle}</p>
              <Link href={`/${locale}/#catalogo`} className="inline-block bg-white hover:bg-gray-100 text-gray-900 px-6 py-2.5 md:px-8 md:py-3.5 text-[9px] md:text-xs font-black tracking-widest uppercase rounded-none transition-all transform hover:scale-[1.02] shadow-lg">
                Ver Colección
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tira que va girando (Scrolling Marquee Ribbon) */}
      <div className="w-full bg-[#FAE8E8] text-[#8B5A5A] py-4 overflow-hidden select-none border-y border-[#E8C5C4]/20 relative">
        <div className="animate-marquee whitespace-nowrap">
          <div className="flex gap-16 text-[10px] font-black uppercase tracking-widest shrink-0 items-center">
            <span>• NUEVA COLECCIÓN</span>
            <span>• DISPONIBLE EN TIENDAS Y ONLINE</span>
            <span>• EXCLUSIVIDAD PHALAY</span>
            <span>• DESCUENTOS DE TEMPORADA</span>
          </div>
          <div className="flex gap-16 text-[10px] font-black uppercase tracking-widest shrink-0 items-center pl-16">
            <span>• NUEVA COLECCIÓN</span>
            <span>• DISPONIBLE EN TIENDAS Y ONLINE</span>
            <span>• EXCLUSIVIDAD PHALAY</span>
            <span>• DESCUENTOS DE TEMPORADA</span>
          </div>
          <div className="flex gap-16 text-[10px] font-black uppercase tracking-widest shrink-0 items-center pl-16">
            <span>• NUEVA COLECCIÓN</span>
            <span>• DISPONIBLE EN TIENDAS Y ONLINE</span>
            <span>• EXCLUSIVIDAD PHALAY</span>
            <span>• DESCUENTOS DE TEMPORADA</span>
          </div>
        </div>
      </div>

      {/* 1. Novedades (Nuestra Selección) - Puesto Primero */}
      <NovedadesCarousel initialProducts={dbProducts} />

      {/* 2. Catálogo — Categorías */}
      <CategoriasCarousel initialCategories={dbCategories} />

      {/* 3. Colecciones */}
      <ColeccionesCarousel initialCollections={collections} locale={locale} />
    </>
  );
}
