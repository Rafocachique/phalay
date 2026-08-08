'use client';

import Link from 'next/link';
import { 
  LayoutDashboard, ShoppingBag, Layers, ClipboardList, Users, 
  Palette, Scale, Wallet, Tag, ChevronDown, Settings, Info, Truck, Menu, X 
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { AdminLogoutButton } from '@/components/AdminLogoutButton';

function UserProfileDropdown({ 
  user, 
  isProfileOpen, 
  setIsProfileOpen, 
  align = 'right',
  isMobile = false
}: { 
  user: any; 
  isProfileOpen: boolean; 
  setIsProfileOpen: (open: boolean) => void; 
  align?: 'left' | 'right';
  isMobile?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsProfileOpen]);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-gray-100 transition-all border border-gray-150 bg-white shadow-sm"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B5A5A] to-[#A87474] flex items-center justify-center text-white font-bold text-xs shadow-sm border border-white">
          {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
        </div>
        {!isMobile && (
          <div className="text-left hidden sm:block pr-1">
            <p className="text-xs font-bold text-gray-900 leading-none">
              {user?.firstName || 'Usuario'}
            </p>
            <p className="text-[9px] font-medium text-[#8B5A5A] mt-0.5">
              {user?.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador'}
            </p>
          </div>
        )}
        <ChevronDown size={14} className={`opacity-60 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
      </button>

      {isProfileOpen && (
        <div className={`
          absolute mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50
          ${align === 'right' ? 'right-0' : 'left-0'}
        `}>
          <div className="p-3.5 border-b border-gray-100 bg-gray-50/50">
            <p className="text-xs font-bold text-gray-950 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email}</p>
          </div>
          <div className="p-1">
            <Link 
              href="/perfil" 
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-[#FAE8E8]/60 hover:text-[#8B5A5A] rounded-lg transition-colors w-full"
            >
              <Settings size={14} /> Ajustes de Perfil
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}

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
          <div className="flex items-center gap-3">
            <UserProfileDropdown user={user} isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen} align="right" isMobile />
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
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

          <nav className="mt-4 px-4 flex-1 overflow-y-auto overflow-x-hidden pb-6 space-y-6">
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
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-screen overflow-auto ${isAuthPage ? 'w-full' : ''}`}>
        {/* Desktop Header bar containing the Profile Dropdown */}
        {!isAuthPage && (
          <header className="hidden md:flex items-center justify-end h-16 px-8 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm shrink-0">
            <UserProfileDropdown user={user} isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen} align="right" />
          </header>
        )}
        <Toaster position="top-center" richColors />
        <div className={isAuthPage ? '' : 'p-4 sm:p-8 w-full flex-1'}>
          {children}
        </div>
      </main>
    </div>
  );
}
