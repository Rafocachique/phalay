'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Instagram, Facebook, MessageCircle, Send, Music2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

interface FooterProps {
  initialStoreName?: string;
  initialDescription?: string;
  initialSocialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
  };
}

export function Footer({ initialStoreName, initialDescription, initialSocialLinks }: FooterProps = {}) {
  const params = useParams();
  const locale = params?.locale || 'es';
  
  const { settings, setSettings } = useStoreSettingsStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterWebsite, setNewsletterWebsite] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const whatsappNumber = (settings.socialLinks.whatsapp || '').replace(/\D/g, '').slice(-9);
  const whatsappHref = whatsappNumber ? `https://wa.me/51${whatsappNumber}` : '';

  useEffect(() => {
    // Si recibimos props iniciales y el store aún tiene valores por defecto, los seteamos
    if (initialStoreName && settings.storeName === 'PHALAY') {
      setSettings({
        storeName: initialStoreName || 'PHALAY',
        storeDescription: initialDescription || 'Moda que trasciende tendencias.',
        socialLinks: {
          instagram: initialSocialLinks?.instagram || '',
          facebook: initialSocialLinks?.facebook || '',
          tiktok: initialSocialLinks?.tiktok || '',
          whatsapp: initialSocialLinks?.whatsapp || ''
        }
      });
    }
  }, [initialStoreName, initialDescription, initialSocialLinks, setSettings]);

  async function subscribeToNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();
    if (!email) {
      setNewsletterMessage('Ingresa tu correo electrónico.');
      return;
    }
    if (!newsletterConsent) {
      setNewsletterMessage('Debes aceptar la Política de Privacidad para suscribirte.');
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website: newsletterWebsite, consent: newsletterConsent }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'No pudimos registrar tu correo.');
      setNewsletterMessage(payload.message || '¡Listo! Tu correo quedó registrado.');
      setNewsletterEmail('');
    } catch (error) {
      setNewsletterMessage(error instanceof Error ? error.message : 'No pudimos registrar tu correo.');
    } finally {
      setNewsletterLoading(false);
    }
  }

  return (
    <footer className="bg-white border-t border-gray-150 pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div>
            <h2 className="text-5xl font-black tracking-[0.2em] text-[#8B5A5A] mb-6 font-serif uppercase">{settings.storeName}</h2>
            <p className="text-base text-gray-600 font-medium mb-6 leading-relaxed">{settings.storeDescription}</p>
            <div className="flex gap-4">
              {settings.socialLinks.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Instagram" title="Instagram" className="text-[#E4405F] transition-colors hover:text-[#C13584]"><Instagram size={20} /></a>
              )}
              {settings.socialLinks.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Facebook" title="Facebook" className="text-[#1877F2] transition-colors hover:text-[#166FE5]"><Facebook size={20} /></a>
              )}
              {settings.socialLinks.tiktok && (
                <a href={settings.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="Síguenos en TikTok" title="TikTok" className="text-black transition-colors hover:text-[#FF0050]"><Music2 size={20} /></a>
              )}
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp" title="Escríbenos por WhatsApp" className="inline-flex h-5 w-5 items-center justify-center text-[#25D366] transition-colors hover:text-[#1FB957]">
                  <MessageCircle size={20} strokeWidth={2.2} />
                </a>
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
              <li><Link href={`/${locale}/legal/reclamaciones`} className="hover:text-[#8B5A5A] transition-colors">Libro de Reclamaciones</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-semibold text-lg text-gray-900 mb-6 uppercase tracking-wider">Boletín</h3>
            <p className="text-base text-gray-600 font-medium mb-4 leading-relaxed">Únete para recibir acceso exclusivo a lanzamientos.</p>
            <form onSubmit={subscribeToNewsletter} className="space-y-2">
              <label className="sr-only" htmlFor="newsletter-email">Correo electrónico</label>
              <div className="flex">
                <input id="newsletter-email" type="email" required autoComplete="email" value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="Tu correo electrónico" className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-l-lg px-4 py-3 text-base focus:outline-none focus:border-[#8B5A5A]" />
                <button type="submit" disabled={newsletterLoading} aria-label="Suscribirme al boletín" className="bg-[#8B5A5A] text-white px-5 py-3 rounded-r-lg hover:bg-[#A87474] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center transition-colors">
                  <Send size={18} />
                </button>
              </div>
              <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={newsletterWebsite} onChange={(event) => setNewsletterWebsite(event.target.value)} className="absolute -left-[10000px] h-px w-px opacity-0" name="website" />
              <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-gray-500">
                <input type="checkbox" checked={newsletterConsent} onChange={(event) => setNewsletterConsent(event.target.checked)} className="mt-1 h-3.5 w-3.5 accent-[#8B5A5A]" />
                <span>Acepto el tratamiento de mis datos para recibir novedades, conforme a la <Link href={`/${locale}/legal/privacidad`} className="underline hover:text-[#8B5A5A]">Política de Privacidad</Link>.</span>
              </label>
              {newsletterMessage && <p role="status" className="text-sm text-gray-600">{newsletterMessage}</p>}
            </form>
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
