'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

interface ColeccionesCarouselProps {
  initialCollections: any[];
  locale: string;
}

function AdaptiveCardImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div className="absolute inset-0 w-full h-full bg-gray-100">
      <img 
        ref={imgRef}
        src={src} 
        alt={alt} 
        draggable="false"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-[800ms] ease-out select-none ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default function ColeccionesCarousel({ initialCollections, locale }: ColeccionesCarouselProps) {
  const collections = [...initialCollections].sort((a, b) => {
    const aCount = a.products?.length || 0;
    const bCount = b.products?.length || 0;
    return bCount - aCount;
  });

  if (collections.length === 0) return null;

  return (
    <section id="colecciones" className="w-full px-6 md:px-12 py-16 relative select-none scroll-mt-24 border-t border-gray-150 bg-white">
      {/* HEADER ALIGNED WITH NUESTRA SELECCION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
        <div>
          <h2 className="text-3xl font-serif font-medium tracking-widest text-gray-900 uppercase">
            NUESTRAS COLECCIONES
          </h2>
          <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase mt-2">
            Descubre piezas únicas diseñadas según tu estilo
          </p>
        </div>
        <Link href={`/${locale}/colecciones`} className="text-xs font-black uppercase tracking-wider text-[#8B5A5A] hover:text-[#A87474] transition-colors pb-1">
          Ver todas →
        </Link>
      </div>

      {/* RENDER A CLEAN, LARGE, SQUARE FULL-WIDTH GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
        {collections.map((col: any) => (
          <Link 
            href={`/${locale}/catalogo?coleccion=${col.id}`} 
            key={col.id}
            className="group relative block aspect-[3/4] overflow-hidden transition-all duration-500 bg-gray-50 border border-gray-100 rounded-none"
          >
            <AdaptiveCardImage 
              src={col.imageUrl || 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80'} 
              alt={col.name} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-90 transition-opacity duration-300 z-20"></div>
            
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-30">
              <div>
                <h3 className="text-xl md:text-2xl font-serif mb-2 tracking-wide text-white drop-shadow-sm uppercase">
                  {col.name}
                </h3>
                <p className="text-[10px] md:text-xs text-gray-300 line-clamp-2 leading-relaxed opacity-95">
                  {col.description || 'Descubre piezas únicas diseñadas para trascender tendencias.'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
