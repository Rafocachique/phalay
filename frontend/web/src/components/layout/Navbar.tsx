'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, ShoppingBag, Heart, X, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useEffect } from 'react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { UserMenu } from './UserMenu';

export type InitialUser = { email: string; firstName: string; lastName: string } | null;

export function Navbar({
  initialStoreName = 'PHALAY',
  initialUser = null,
}: {
  initialStoreName?: string;
  initialUser?: InitialUser;
}) {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const params = useParams();
  const locale = params?.locale || 'es';

  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  
  const { settings, setSettings, startPolling } = useStoreSettingsStore();

  useEffect(() => {
    // Si recibimos un nombre inicial del layout, lo seteamos
    if (initialStoreName && settings.storeName === 'PHALAY') {
      setSettings({ storeName: initialStoreName });
    }
    // Iniciar polling para actualizaciones en tiempo real
    startPolling();
  }, [initialStoreName, setSettings, startPolling]);

  const storeName = settings.storeName;

  return (
    <>
      <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href={`/${locale}`} className="text-5xl font-black tracking-[0.2em] text-[#8B5A5A] uppercase font-serif">{storeName}</Link>
            <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
              <Link href={`/${locale}/#novedades`} className="hover:text-black border-b-2 border-transparent hover:border-[#8B5A5A] transition-all py-2">Novedades</Link>
              <Link href={`/${locale}/#catalogo`} className="hover:text-black border-b-2 border-transparent hover:border-[#8B5A5A] transition-all py-2">Catálogo</Link>
              <Link href={`/${locale}/#colecciones`} className="hover:text-black border-b-2 border-transparent hover:border-[#8B5A5A] transition-all py-2">Colecciones</Link>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex relative">
              <span className="absolute left-4 top-2.5 text-gray-400">
                <Search size={16} />
              </span>
              <input type="text" placeholder="Buscar estilo..." className="bg-gray-100 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 w-64" />
            </div>
            <Link href={`/${locale}/carrito`} className="text-gray-600 hover:text-[#8B5A5A] transition-colors relative">
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#8B5A5A] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            <button 
              onClick={() => setIsWishlistOpen(true)}
              className="text-gray-600 hover:text-[#8B5A5A] transition-colors relative"
            >
              <Heart size={20} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#8B5A5A] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {wishlistItems.length}
                </span>
              )}
            </button>
            <UserMenu locale={String(locale)} initialUser={initialUser} />
          </div>
        </div>
      </nav>

      {/* Drawer de Favoritos */}
      {isWishlistOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99] transition-opacity duration-300"
            onClick={() => setIsWishlistOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[440px] bg-white shadow-2xl flex flex-col animate-slide-in p-6 border-l border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center pb-6 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <Heart className="text-[#8B5A5A]" fill="#8B5A5A" size={20} />
                  Tus Favoritos
                </h3>
                <p className="text-xs text-gray-500 mt-1">Guarda las prendas que más te gustan</p>
              </div>
              <button 
                onClick={() => setIsWishlistOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {wishlistItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[#FAF6F6] flex items-center justify-center mb-4">
                    <Heart className="text-gray-300" size={28} />
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Tu lista está vacía</p>
                  <p className="text-xs text-gray-400 max-w-[200px] mb-6 leading-relaxed">Navega por la tienda y guarda tus diseños favoritos.</p>
                  <button 
                    onClick={() => {
                      setIsWishlistOpen(false);
                      // Scroll to catalog section or redirect
                      window.location.hash = 'catalogo';
                    }}
                    className="bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors shadow-sm"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                wishlistItems.map((item) => (
                  <div key={item.slug} className="flex gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors group">
                    <div className="w-20 h-24 rounded-xl bg-gray-100 overflow-hidden relative flex-shrink-0">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                        <span className="text-xs font-bold text-gray-600 block mt-1">S/ {item.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Link 
                          href={`/${locale}/producto/${item.slug}`} 
                          onClick={() => setIsWishlistOpen(false)}
                          className="text-xs font-bold text-[#8B5A5A] hover:text-[#6A3F3F] hover:underline"
                        >
                          Ver Detalles
                        </Link>
                        <button 
                          onClick={() => toggleWishlist(item)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                          title="Eliminar de favoritos"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {wishlistItems.length > 0 && (
              <div className="border-t border-gray-100 pt-6 mt-6">
                <Link 
                  href={`/${locale}/catalogo`}
                  onClick={() => setIsWishlistOpen(false)}
                  className="block text-center w-full bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white py-4 rounded-2xl text-xs font-bold tracking-widest uppercase transition-colors shadow-md"
                >
                  Seguir Explorando
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
