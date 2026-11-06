'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Instagram, Facebook, MessageCircle, Send } from 'lucide-react';
import { useEffect } from 'react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

interface FooterProps {
  initialStoreName?: string;
  initialDescription?: string;
  initialSocialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
}

export function Footer({ initialStoreName, initialDescription, initialSocialLinks }: FooterProps = {}) {
  const params = useParams();
  const locale = params?.locale || 'es';
  
  const { settings, setSettings } = useStoreSettingsStore();

  useEffect(() => {
    // Si recibimos props iniciales y el store aún tiene valores por defecto, los seteamos
    if (initialStoreName && settings.storeName === 'PHALAY') {
      setSettings({
        storeName: initialStoreName || 'PHALAY',
        storeDescription: initialDescription || 'Moda que trasciende tendencias.',
        socialLinks: {
          instagram: initialSocialLinks?.instagram || '',
          facebook: initialSocialLinks?.facebook || '',
          whatsapp: initialSocialLinks?.whatsapp || ''
        }
      });
    }
  }, [initialStoreName, initialDescription, initialSocialLinks, setSettings]);

  return (
    <footer className="bg-white border-t border-gray-150 pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div>
            <h2 className="text-5xl font-black tracking-[0.2em] text-[#8B5A5A] mb-6 font-serif uppercase">{settings.storeName}</h2>
            <p className="text-base text-gray-600 font-medium mb-6 leading-relaxed">{settings.storeDescription}</p>
            <div className="flex gap-4 text-gray-500">
              {settings.socialLinks.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#8B5A5A] transition-colors"><Instagram size={20} /></a>
              )}
              {settings.socialLinks.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#8B5A5A] transition-colors"><Facebook size={20} /></a>
              )}
              {settings.socialLinks.whatsapp && (
                <a href={settings.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-[#8B5A5A] transition-colors"><MessageCircle size={20} /></a>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-serif font-semibold text-lg text-gray-900 mb-6 uppercase tracking-wider">Explorar</h3>
            <ul className="space-y-4 text-base font-semibold text-gray-500">
              <li><Link href={`/${locale}/#novedades`} className="hover:text-[#8B5A5A] transition-colors">Novedades</Link></li>
              <li><Link href={`/${locale}/#catalogo`} className="hover:text-[#8B5A5A] transition-colors">Catálogo General</Link></li>
              <li><Link href={`/${locale}/#colecciones`} className="hover:text-[#8B5A5A] transition-colors">Colecciones Exclusivas</Link></li>
              <li><Link href={`/${locale}/catalogo`} className="hover:text-[#8B5A5A] transition-colors">Ver Todo el Catálogo</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-semibold text-lg text-gray-900 mb-6 uppercase tracking-wider">Mi Cuenta</h3>
            <ul className="space-y-4 text-base font-semibold text-gray-500">
              <li><Link href={`/${locale}/auth/login`} className="hover:text-[#8B5A5A] transition-colors">Iniciar Sesión</Link></li>
              <li><Link href={`/${locale}/mis-pedidos`} className="hover:text-[#8B5A5A] transition-colors">Mis Pedidos</Link></li>
              <li><Link href={`/${locale}/legal/terminos`} className="hover:text-[#8B5A5A] transition-colors">Envíos y Devoluciones</Link></li>
              <li><Link href={`/${locale}/soporte/faq`} className="hover:text-[#8B5A5A] transition-colors">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-semibold text-lg text-gray-900 mb-6 uppercase tracking-wider">Boletín</h3>
            <p className="text-base text-gray-600 font-medium mb-4 leading-relaxed">Únete para recibir acceso exclusivo a lanzamientos.</p>
            <div className="flex">
              <input type="email" placeholder="Email" className="flex-1 bg-gray-50 border border-gray-200 rounded-l-lg px-4 py-3 text-base focus:outline-none focus:border-[#8B5A5A]" />
              <button className="bg-[#8B5A5A] text-white px-5 py-3 rounded-r-lg hover:bg-[#A87474] flex items-center justify-center transition-colors">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-150 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 font-medium">
          <p>© {new Date().getFullYear()} {settings.storeName} Todos los derechos reservados.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href={`/${locale}/legal/privacidad`} className="hover:text-[#8B5A5A] transition-colors">Políticas de Privacidad</Link>
            <Link href={`/${locale}/legal/terminos`} className="hover:text-[#8B5A5A] transition-colors">Términos y Condiciones</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
