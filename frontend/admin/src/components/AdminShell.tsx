'use client';

import Link from 'next/link';
import {
  LayoutDashboard, ShoppingBag, Layers, ClipboardList, Users,
  Palette, Scale, Wallet, Tag, ChevronDown, Settings, Info, Truck, Menu, X, FileText, MessageCircle
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
        { name: 'Probar asistente', href: '/chatbot', icon: <Info size={16} strokeWidth={2.5} /> },
        { name: 'WhatsApp', href: '/whatsapp', icon: <MessageCircle size={16} strokeWidth={2.5} /> },
        { name: 'Textos Legales', href: '/legal', icon: <Scale size={16} strokeWidth={2.5} /> },
        { name: 'Libro de Reclamaciones', href: '/reclamaciones', icon: <FileText size={16} strokeWidth={2.5} /> },
      ],
    },
  ];

  // El equipo sólo lo administra un SUPER_ADMIN.
  if (user?.role === 'SUPER_ADMIN') {
    directItems.push({ name: 'Usuarios', href: '/users', icon: <Users size={17} strokeWidth={2.5} /> });
    directItems.push({ name: 'Pasarela', href: '/pasarela', icon: <Wallet size={17} strokeWidth={2.5} /> });
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

  const navItemClass = (active: boolean) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${active
    ? 'bg-gradient-to-r from-[#E8C5C4] to-[#E5B8B3] text-[#6A3F3F] shadow-sm'
    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`;

  return (
    <div className="min-h-screen w-full lg:flex">
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-white lg:sticky lg:top-0 lg:flex xl:w-80">
        <div className="border-b border-gray-100 px-6 py-6"><Link href="/" className="block"><p className="text-2xl font-black tracking-tighter text-[#8B5A5A] uppercase">{storeName}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Panel de administración</p></Link></div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <div><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Principal</p><div className="space-y-1">{directItems.map((item) => <Link key={item.href} href={item.href} className={navItemClass(isDirectActive(item))}><span className="opacity-65">{item.icon}</span>{item.name}</Link>)}</div></div>
          {groups.map((group) => <div key={group.name}><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">{group.name}</p><div className="space-y-1">{group.items.map((item) => <Link key={item.href} href={item.href} className={navItemClass(pathname.startsWith(item.href))}><span className="opacity-65">{item.icon}</span>{item.name}</Link>)}</div></div>)}
        </nav>
        <div className="border-t border-gray-100 p-4"><UserProfileDropdown user={user} isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen} /></div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur lg:hidden"><div className="flex h-16 items-center justify-between px-4"><Link href="/" className="text-xl font-black tracking-tighter text-[#8B5A5A] uppercase">{storeName}</Link><div className="flex items-center gap-2"><UserProfileDropdown user={user} isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen} /><button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100" aria-label="Abrir menú">{isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button></div></div>
          {isMobileMenuOpen && <nav className="max-h-[calc(100vh-4rem)] space-y-5 overflow-y-auto border-t border-gray-100 bg-white px-4 py-4"><div className="space-y-1">{directItems.map((item) => <Link key={item.href} href={item.href} className={navItemClass(isDirectActive(item))}><span className="opacity-65">{item.icon}</span>{item.name}</Link>)}</div>{groups.map((group) => <div key={group.name}><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">{group.name}</p><div className="space-y-1">{group.items.map((item) => <Link key={item.href} href={item.href} className={navItemClass(pathname.startsWith(item.href))}><span className="opacity-65">{item.icon}</span>{item.name}</Link>)}</div></div>)}</nav>}
        </header>
        <main className="w-full"><div className="mx-auto w-full max-w-[1700px] p-4 sm:p-6 lg:p-8">{children}</div></main>
      </div>
      <Toaster position="top-center" richColors />
      <IdleSessionGuard timeoutMinutes={idleTimeoutMinutes} />
    </div>
  );
}
