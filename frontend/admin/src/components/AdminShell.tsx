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
import IdleSessionGuard from '@/components/IdleSessionGuard';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface NavGroup {
  name: string;
  icon: React.ReactNode;
  items: NavItem[];
}

function UserProfileDropdown({
  user,
  isProfileOpen,
  setIsProfileOpen,
}: {
  user: any;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

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
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-gray-100 transition-all border border-gray-200 bg-white shadow-sm"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B5A5A] to-[#A87474] flex items-center justify-center text-white font-bold text-xs shadow-sm border border-white">
          {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
        </div>
        <div className="text-left hidden sm:block pr-1">
          <p className="text-xs font-bold text-gray-900 leading-none">{user?.firstName || 'Usuario'}</p>
          <p className="text-[9px] font-medium text-[#8B5A5A] mt-0.5">
            {user?.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador'}
          </p>
        </div>
        <ChevronDown size={14} className={`opacity-60 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
      </button>

      {isProfileOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
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

/** Sección del menú superior que agrupa varias páginas en un desplegable. */
function NavGroupMenu({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = group.items.some((item) => pathname.startsWith(item.href));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
          isActive
            ? 'bg-gradient-to-r from-[#E8C5C4] to-[#E5B8B3] text-[#6A3F3F] shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <span className="opacity-60">{group.icon}</span>
        {group.name}
        <ChevronDown size={14} className={`opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 p-1">
          {group.items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg transition-colors ${
                  active ? 'bg-[#FAE8E8]/70 text-[#8B5A5A]' : 'text-gray-700 hover:bg-gray-50 hover:text-[#8B5A5A]'
                }`}
              >
                <span className="opacity-60">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminShell({
  children,
  user,
  idleTimeoutMinutes = 20,
}: {
  children: React.ReactNode;
  user?: any;
  idleTimeoutMinutes?: number;
}) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState('PHALAY');

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    fetch(`${API_BASE_URL}/stores?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.storeName) setStoreName(data.storeName);
      })
      .catch(() => {});
  }, []);

  // Accesos directos: lo que se usa a diario queda a un solo clic.
  const directItems: NavItem[] = [
    { name: 'Inicio', href: '/', icon: <LayoutDashboard size={17} strokeWidth={2.5} />, exact: true },
    { name: 'Pedidos', href: '/orders', icon: <ClipboardList size={17} strokeWidth={2.5} /> },
  ];

  const groups: NavGroup[] = [
    {
      name: 'Mi Tienda',
      icon: <ShoppingBag size={17} strokeWidth={2.5} />,
      items: [
        { name: 'Productos', href: '/productos', icon: <ShoppingBag size={16} strokeWidth={2.5} /> },
        { name: 'Banners', href: '/appearance', icon: <Palette size={16} strokeWidth={2.5} /> },
        { name: 'Catálogo', href: '/catalogo', icon: <Tag size={16} strokeWidth={2.5} /> },
        { name: 'Colecciones', href: '/colecciones', icon: <Layers size={16} strokeWidth={2.5} /> },
      ],
    },
    {
      name: 'Configuración',
      icon: <Settings size={17} strokeWidth={2.5} />,
      items: [
        { name: 'Envíos y Destinos', href: '/envios', icon: <Truck size={16} strokeWidth={2.5} /> },
        { name: 'Pagos (Yape)', href: '/pagos', icon: <Wallet size={16} strokeWidth={2.5} /> },
        { name: 'Ajustes Generales', href: '/settings', icon: <Settings size={16} strokeWidth={2.5} /> },
        { name: 'Preguntas Frecuentes', href: '/faqs', icon: <Info size={16} strokeWidth={2.5} /> },
        { name: 'Textos Legales', href: '/legal', icon: <Scale size={16} strokeWidth={2.5} /> },
      ],
    },
  ];

  // El equipo sólo lo administra un SUPER_ADMIN.
  if (user?.role === 'SUPER_ADMIN') {
    directItems.push({ name: 'Usuarios', href: '/users', icon: <Users size={17} strokeWidth={2.5} /> });
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full">
        <Toaster position="top-center" richColors />
        {children}
      </div>
    );
  }

  const isDirectActive = (item: NavItem) =>
    item.exact ? pathname === '/' : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        {/* Una sola fila: marca, navegación y perfil a la misma altura. */}
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-baseline gap-2 min-w-0 shrink-0">
            <span className="text-xl xl:text-2xl font-black text-[#8B5A5A] tracking-tighter uppercase truncate">
              {storeName}
            </span>
            <span className="hidden 2xl:inline text-[10px] font-bold text-gray-400 tracking-widest uppercase">
              Panel de Administración
            </span>
          </Link>

          <div className="flex-1" />

          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {directItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                  isDirectActive(item)
                    ? 'bg-gradient-to-r from-[#E8C5C4] to-[#E5B8B3] text-[#6A3F3F] shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="opacity-60">{item.icon}</span>
                {item.name}
              </Link>
            ))}

            <span className="w-px h-6 bg-gray-200 mx-1.5" />

            {groups.map((group) => (
              <NavGroupMenu key={group.name} group={group} pathname={pathname} />
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <UserProfileDropdown user={user} isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen} />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Menú desplegable en móvil: mismas secciones, en acordeón simple */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-5">
            {/* Sin overflow propio: el menú crece y se desplaza con la página,
                así nunca aparecen dos barras de scroll a la vez. */}
            <div className="space-y-1">
              {directItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                    isDirectActive(item)
                      ? 'bg-gradient-to-r from-[#E8C5C4] to-[#E5B8B3] text-[#6A3F3F]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="opacity-60">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>

            {groups.map((group) => (
              <div key={group.name}>
                <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{group.name}</p>
                <div className="space-y-1 pl-2 border-l-2 border-gray-100 ml-4">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                        pathname.startsWith(item.href)
                          ? 'bg-gradient-to-r from-[#E8C5C4] to-[#E5B8B3] text-[#6A3F3F]'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="opacity-60">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        )}
      </header>

      <Toaster position="top-center" richColors />
      <IdleSessionGuard timeoutMinutes={idleTimeoutMinutes} />

      <main className="flex-1 w-full">
        <div className="max-w-[1600px] mx-auto w-full p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
