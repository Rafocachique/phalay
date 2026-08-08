'use client';

import Link from 'next/link';
import { 
  LayoutDashboard, ShoppingBag, Layers, ClipboardList, Users, 
  Palette, Scale, Wallet, Tag, ChevronDown, Settings, Info, Truck, Menu, X 
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AdminLogoutButton } from '@/components/AdminLogoutButton';

export default function AdminShell({ children, user }: { children: React.ReactNode, user?: any }) {
  const pathname = usePathname();
  const [isContentOpen, setIsContentOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on path changes (e.g. navigation in mobile view)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const storeItems = [
    { name: 'Inicio', href: '/', icon: <LayoutDashboard size={18} strokeWidth={2.5} />, exact: true },
    { name: 'Pedidos', href: '/orders', icon: <ClipboardList size={18} strokeWidth={2.5} /> },
  ];

  if (user?.role === 'SUPER_ADMIN') {
    storeItems.push({ name: 'Equipo / Usuarios', href: '/users', icon: <Users size={18} strokeWidth={2.5} /> });
  }

  const contentItems = [
    { name: 'Productos', href: '/productos', icon: <ShoppingBag size={18} strokeWidth={2.5} /> },
    { name: 'Banners', href: '/appearance', icon: <Palette size={18} strokeWidth={2.5} /> },
    { name: 'Catálogo', href: '/catalogo', icon: <Tag size={18} strokeWidth={2.5} /> },
    { name: 'Colecciones', href: '/colecciones', icon: <Layers size={18} strokeWidth={2.5} /> },
  ];

  const configItems = [
    { name: 'Envíos y Destinos', href: '/envios', icon: <Truck size={18} strokeWidth={2.5} /> },
    { name: 'Pagos (Yape)', href: '/pagos', icon: <Wallet size={18} strokeWidth={2.5} /> },
    { name: 'Ajustes Generales', href: '/settings', icon: <Settings size={18} strokeWidth={2.5} /> },
    { name: 'Preguntas Frecuentes', href: '/faqs', icon: <Info size={18} strokeWidth={2.5} /> },
    { name: 'Textos Legales', href: '/legal', icon: <Scale size={18} strokeWidth={2.5} /> },
  ];

  const [storeName, setStoreName] = useState('PHALAY');

  useEffect(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    fetch(`${API_BASE_URL}/stores?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.storeName) {
          setStoreName(data.storeName);
        }
      })
      .catch(() => {});
  }, []);

  // Hide sidebar on authentication pages (login, register)
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full relative">
      {/* Mobile Header Bar */}
      {!isAuthPage && (
        <header className="flex md:hidden items-center justify-between px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-40 w-full shadow-sm">
          <div>
            <h2 className="text-xl font-black text-[#8B5A5A] tracking-tighter uppercase truncate">{storeName}</h2>
            <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mt-0.5">Admin</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>
      )}

      {/* Backdrop for Mobile Sidebar Drawer */}
      {!isAuthPage && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-45 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      {!isAuthPage && (
        <aside className={`
          fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shrink-0 flex flex-col h-screen z-50 shadow-xl md:shadow-sm
          transform transition-transform duration-300 md:transform-none md:sticky md:top-0 md:z-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Sidebar Header */}
          <div className="p-6 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#8B5A5A] tracking-tighter uppercase truncate">{storeName}</h2>
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mt-1">Panel de Administración</p>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close Menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="mt-4 px-4 flex-1 overflow-y-auto overflow-x-hidden pb-4 space-y-6">
            {/* Tienda Section */}
            <div>
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Administración</p>
              <div className="space-y-1">
                {storeItems.map((item) => {
                  const isActive = item.exact ? pathname === '/' : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
                        isActive 
                          ? 'bg-gradient-to-r from-[#E8C5C4] to-[#E5B8B3] text-[#6A3F3F] shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3 opacity-60">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Content Section */}
            <div>
              <button 
                onClick={() => setIsContentOpen(!isContentOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-900 transition-colors group"
              >
                <span className="group-hover:text-gray-900">Mi Tienda</span>
                <ChevronDown size={16} className={`transform transition-transform duration-200 ${isContentOpen ? 'rotate-180' : ''}`} />
              </button>
              {isContentOpen && (
                <div className="space-y-1 mt-2 pl-2 border-l-2 border-gray-200 ml-4">
                  {contentItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                          isActive 
                            ? 'bg-gradient-to-r from-[#E8C5C4] to-[#E5B8B3] text-[#6A3F3F] shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <span className="mr-3 opacity-60">{item.icon}</span>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Config Section */}
            <div>
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Configuración</p>
              <div className="space-y-1">
                {configItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
                        isActive 
                          ? 'bg-gradient-to-r from-[#E8C5C4] to-[#E5B8B3] text-[#6A3F3F] shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3 opacity-60">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-100 space-y-3 mt-auto">
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#FAE8E8] to-[#F5D9D9] rounded-lg hover:from-[#F5D9D9] hover:to-[#ECC9C9] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8B5A5A] to-[#A87474] overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                  <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                    {user?.firstName?.charAt(0) || ''}{user?.lastName?.charAt(0) || ''}
                  </span>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.firstName || 'Usuario'} {user?.lastName || ''}
                  </p>
                  <p className="text-[11px] font-medium text-[#8B5A5A]">
                    {user?.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador'}
                  </p>
                </div>
                <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Sesión</p>
                  </div>
                  <Link href="/perfil" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors w-full border-b border-gray-50">
                    <Settings size={16} /> Ajustes de Perfil
                  </Link>
                  <AdminLogoutButton />
                </div>
              )}
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-green-700">Sistema en línea</span>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-auto ${isAuthPage ? 'w-full' : ''}`}>
        <Toaster position="top-center" richColors />
        <div className={isAuthPage ? '' : 'p-4 sm:p-8 w-full'}>
          {children}
        </div>
      </main>
    </div>
  );
}
