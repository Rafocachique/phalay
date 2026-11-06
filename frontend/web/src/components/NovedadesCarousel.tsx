'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';

const NOVEDADES_FALLBACK = [
  { title: "Look 'Office Chic'", price: "S/ 245.00", desc: "Combina elegancia y comodidad para tu día a día profesional.", img: "https://images.unsplash.com/photo-1485230895905-ef05bad3a5bb?w=600&q=80", slug: "look-office-chic", sizes: ['S', 'M', 'L'] },
  { title: "Escapada de Fin de Semana", price: "S/ 310.00", desc: "Prendas versátiles diseñadas para el relax sin perder el estilo.", img: "https://images.unsplash.com/photo-1515347619147-3a5bbd699507?w=600&q=80", slug: "escapada-fin-semana", sizes: ['M', 'L'] },
  { title: "Edición Noche", price: "S/ 420.00", desc: "Brilla con luz propia con texturas satinadas y detalles en seda.", img: "https://images.unsplash.com/photo-1550614000-4b95d4e11bc9?w=600&q=80", slug: "edicion-noche", sizes: ['S', 'M'] },
  { title: "Brunch Primaveral", price: "S/ 280.00", desc: "Colores frescos y tejidos ligeros para tus mañanas perfectas.", img: "https://images.unsplash.com/photo-1434389678232-068305cbe040?w=600&q=80", slug: "brunch-primaveral", sizes: ['S', 'M', 'L', 'XL'] },
];

interface NovedadesCarouselProps {
  initialProducts?: any[];
}

export default function NovedadesCarousel({ initialProducts = [] }: NovedadesCarouselProps) {
  const params = useParams();
  const locale = params?.locale || 'es';
  
  const [products] = useState<any[]>(initialProducts);
  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleWishlistStore = useWishlistStore((state) => state.toggleWishlist);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const isInWishlist = (slug: string) => {
    return wishlistItems.some(i => i.slug === slug);
  };

  const handleToggleWishlist = (item: any) => {
    toggleWishlistStore({
      title: item.title,
      price: item.price,
      img: item.img,
      slug: item.slug
    });
    if (isInWishlist(item.slug)) {
      showToast('Eliminado de tus favoritos');
    } else {
      showToast('Agregado a tus favoritos');
    }
  };

  // Función para quitar etiquetas HTML
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').trim();
  };

  const displayItems = products.length > 0 ? products.map(p => ({
    title: p.name,
    price: typeof p.price === 'number' ? `S/ ${p.price.toFixed(2)}` : `S/ ${parseFloat(p.price || '0').toFixed(2)}`,
    desc: stripHtml(p.description) || 'Prenda exclusiva de alta costura.',
    img: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1515347619147-3a5bbd699507?w=600&q=80',
    slug: p.slug,
    sizes: p.variants?.map((v: any) => v.size).filter((value: any, index: any, self: any) => self.indexOf(value) === index) || ['S', 'M', 'L']
  })) : NOVEDADES_FALLBACK;

  return (
    <section id="novedades" className="bg-white py-16 md:py-24 select-none w-full border-t border-gray-150">
      <div className="w-full px-6 md:px-12">
        {/* Title matches "Nuestra Selección" look */}
        <div className="mb-12">
          <h2 className="text-3xl font-serif font-medium tracking-widest text-gray-900 uppercase">
            NUESTRA SELECCIÓN
          </h2>
          <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase mt-2">Novedades exclusivas para ti</p>
        </div>

        {/* 4 Column Grid stretching full width */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 w-full">
          {displayItems.map((item, i) => (
            <div 
              key={i} 
              className="group flex flex-col transition-all duration-300 animate-enter"
            >
              {/* Product Portrait Image wrapper */}
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-4 cursor-pointer">
                <Link href={`/${locale}/producto/${item.slug}`} className="block w-full h-full">
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    draggable="false"
                    className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700 select-none" 
                  />
                </Link>

                {/* Size Selector Box displayed on Hover, matches Zara/Algo Bonito look */}
                <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm py-2 px-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-gray-100/50 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Seleccionar Talla</span>
                  <div className="flex gap-1.5 flex-wrap justify-center">
                    {item.sizes.map((s: string, idx: number) => (
                      <span 
                        key={idx} 
                        className="text-[10px] font-black text-gray-600 border border-gray-200 bg-white px-2 py-0.5 rounded hover:bg-black hover:text-white transition-colors"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Favorite Heart Button */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleWishlist(item);
                  }}
                  className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform active:scale-90 z-20 ${
                    isInWishlist(item.slug)
                      ? 'bg-[#8B5A5A] text-white'
                      : 'bg-white/90 backdrop-blur-sm text-gray-400 hover:text-[#8B5A5A]'
                  }`}
                  aria-label="Favorito"
                >
                  <Heart size={15} fill={isInWishlist(item.slug) ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Product Metadata */}
              <div className="flex flex-col text-left">
                <Link href={`/${locale}/producto/${item.slug}`} className="hover:text-[#8B5A5A] transition-colors">
                  <h3 className="font-serif font-medium text-gray-900 text-base tracking-wide line-clamp-1 mb-1" title={item.title}>
                    {item.title}
                  </h3>
                </Link>
                <span className="font-semibold text-gray-700 text-sm">{item.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Premium Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-8 right-8 z-50 bg-white/95 backdrop-blur-xl border border-gray-100 text-gray-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform animate-enter max-w-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8B5A5A] animate-pulse" />
          <p className="text-xs font-bold tracking-wide uppercase text-gray-800">{toast.message}</p>
        </div>
      )}
    </section>
  );
}
