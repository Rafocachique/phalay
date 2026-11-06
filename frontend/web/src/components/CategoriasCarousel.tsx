'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const CATALOG_FALLBACK = [
  { name: 'Vestidos', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80', id: 'vestidos' },
  { name: 'Accesorios', img: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=800&q=80', id: 'accesorios' },
  { name: 'Denim', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80', id: 'denim' },
  { name: 'Calzado', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80', id: 'calzado' },
];

function AdaptiveCardImage({ src, alt }: { src: string; alt: string }) {
  const [isLandscape, setIsLandscape] = useState(false);

  return (
    <div className="absolute inset-0 w-full h-full bg-gray-100 rounded-none">
      {/* Background blur only for landscape */}
      {isLandscape && (
        <div className="absolute inset-0 w-full h-full overflow-hidden rounded-none">
          <img 
            src={src} 
            alt=""
            className="w-full h-full object-cover blur-2xl opacity-40 scale-125 select-none pointer-events-none rounded-none" 
          />
        </div>
      )}

      {/* Main Image Container */}
      <div className={`relative w-full h-full z-10 flex items-center justify-center transition-all duration-500 rounded-none ${isLandscape ? 'p-6' : 'p-0'}`}>
        <img 
          src={src} 
          alt={alt} 
          draggable="false"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth > img.naturalHeight) {
              setIsLandscape(true);
            }
          }}
          className={`transition-all duration-[800ms] ease-out select-none rounded-none ${
            isLandscape 
              ? 'max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-105' 
              : 'w-full h-full object-cover group-hover:scale-105'
          } opacity-100`}
        />
      </div>
    </div>
  );
}

interface CategoriasCarouselProps {
  initialCategories?: any[];
}

export default function CategoriasCarousel({ initialCategories = [] }: CategoriasCarouselProps) {
  const params = useParams();
  const locale = params?.locale || 'es';
  const [categories, setCategories] = useState<any[]>(initialCategories);

  useEffect(() => {
    if (initialCategories.length > 0) {
      return; // Already set by initial state
    }
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    fetch(`${API_BASE_URL}/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(CATALOG_FALLBACK);
        }
      })
      .catch(() => setCategories(CATALOG_FALLBACK));
  }, [initialCategories]);

  if (categories.length === 0) return null;

  return (
    <section id="catalogo" className="w-full px-6 md:px-12 py-16 pt-24 select-none scroll-mt-24 border-t border-gray-150 bg-white">
      {/* HEADER ALIGNED WITH NUESTRA SELECCION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
        <div>
          <h2 className="text-3xl font-serif font-medium tracking-widest text-gray-900 uppercase">
            CATÁLOGO
          </h2>
          <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase mt-2">
            Explora nuestras colecciones por tipo de prenda
          </p>
        </div>
        <Link href={`/${locale}/catalogo`} className="text-xs font-black uppercase tracking-wider text-[#8B5A5A] hover:text-[#A87474] transition-colors pb-1">
          Ver todo →
        </Link>
      </div>

      {/* RENDER A CLEAN, LARGE, SQUARE FULL-WIDTH GRID MATCHING COLECIONES AND NUESTRA SELECCION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
        {categories.map((cat: any) => (
          <Link 
            href={`/${locale}/catalogo?categoria=${cat.id}`} 
            key={cat.id}
            className="group relative block aspect-[3/4] overflow-hidden transition-all duration-500 bg-gray-50 border border-gray-100 rounded-none"
          >
            <AdaptiveCardImage 
              src={cat.imageUrl || cat.img || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'} 
              alt={cat.name} 
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-all duration-300 z-20"></div>
            
            <div className="absolute inset-0 p-6 flex flex-col justify-end z-30 text-left">
              <h3 className="text-xl md:text-2xl font-serif font-medium text-white mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 drop-shadow-sm uppercase">
                {cat.name}
              </h3>
              <p className="text-[10px] md:text-xs text-gray-300 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-all duration-500 max-h-0 group-hover:max-h-16 overflow-hidden">
                {cat.description || `Explora nuestra selección exclusiva de ${cat.name.toLowerCase()}.`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
