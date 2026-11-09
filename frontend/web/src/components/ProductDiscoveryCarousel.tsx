'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ProductDiscoveryCarouselProps {
  products?: any[];
}

export default function ProductDiscoveryCarousel({ products = [] }: ProductDiscoveryCarouselProps) {
  const params = useParams();
  const locale = params?.locale || 'es';
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const dragStartRef = useRef<{ x: number; left: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Dos copias permiten volver al inicio sin un salto visible. El contenido
  // sigue siendo navegable por teclado, flechas, rueda, táctil o arrastre.
  const loopedProducts = useMemo(
    () => (products.length > 1 ? [...products, ...products] : products),
    [products],
  );

  if (products.length === 0) return null;

  const cardStep = () => {
    const track = trackRef.current;
    if (!track) return 360;
    const firstCard = track.querySelector<HTMLElement>('[data-carousel-card]');
    return (firstCard?.offsetWidth || 336) + 24;
  };

  const normalizeLoop = () => {
    const track = trackRef.current;
    if (!track || products.length < 2) return;
    const half = track.scrollWidth / 2;
    if (track.scrollLeft >= half - 2) track.scrollLeft -= half;
    if (track.scrollLeft < 0) track.scrollLeft += half;
  };

  const move = (direction: 'previous' | 'next') => {
    const track = trackRef.current;
    if (!track) return;
    const step = cardStep();
    if (direction === 'previous' && products.length > 1 && track.scrollLeft < step / 2) {
      track.scrollLeft += track.scrollWidth / 2;
    }
    track.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (products.length < 2) return;
    const interval = window.setInterval(() => {
      if (!pausedRef.current && !dragStartRef.current) move('next');
    }, 4200);
    return () => window.clearInterval(interval);
  // move only reads refs and derived product length; recreating per item is unnecessary.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || event.pointerType === 'touch') return;
    pausedRef.current = true;
    dragStartRef.current = { x: event.clientX, left: track.scrollLeft };
    track.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const drag = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const start = dragStartRef.current;
    if (!track || !start) return;
    track.scrollLeft = start.left - (event.clientX - start.x);
  };

  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (track?.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    dragStartRef.current = null;
    setIsDragging(false);
    window.setTimeout(() => { pausedRef.current = false; }, 900);
  };

  return (
    <section className="w-full border-t border-gray-150 bg-[#F8F8F8] py-16 md:py-24">
      <div className="w-full px-6 md:px-12">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-serif font-medium tracking-widest text-gray-900 uppercase">Explora más estilos</h2>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Se mueve automáticamente · también puedes arrastrar o usar las flechas</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => move('previous')} aria-label="Ver productos anteriores" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:border-[#8B5A5A] hover:text-[#8B5A5A]"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => move('next')} aria-label="Ver más productos" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:border-[#8B5A5A] hover:text-[#8B5A5A]"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={normalizeLoop}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { if (!isDragging) pausedRef.current = false; }}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          className={`flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          aria-label="Carrusel de productos disponibles"
        >
          {loopedProducts.map((product, index) => {
            const price = Number(product.price || 0).toFixed(2);
            const image = product.images?.[0]?.url;
            return (
              <article key={`${product.id}-${index}`} data-carousel-card className="w-[72vw] shrink-0 snap-start sm:w-[280px]">
                <Link href={`/${locale}/producto/${product.slug}`} className="group block">
                  <div className="aspect-[3/4] overflow-hidden bg-[#f6f4f4]">
                    {image ? <img src={image} alt={product.name} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]" /> : <div className="flex h-full items-center justify-center text-xs font-bold text-gray-400">SIN IMAGEN</div>}
                  </div>
                  <div className="pt-4">
                    <h3 className="truncate font-serif text-base font-medium tracking-wide text-gray-900 transition-colors group-hover:text-[#8B5A5A]">{product.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-gray-700">S/ {price}</p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href={`/${locale}/catalogo`} className="text-xs font-black uppercase tracking-widest text-[#8B5A5A] transition-colors hover:text-[#6A3F3F]">Abrir catálogo completo →</Link>
        </div>
      </div>
    </section>
  );
}
