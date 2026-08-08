import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import '../globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

// Nunca cachear el layout — siempre leer datos frescos de la API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getStoreData() {
  try {
    const res = await fetch(`${API_BASE_URL}/stores`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: {
    default: 'PHALAY - Moda Femenina Online',
    template: '%s | PHALAY',
  },
  description:
    'Descubre las últimas tendencias en moda femenina. Ropa, accesorios y más con envío a todo el país.',
  keywords: ['moda femenina', 'ropa mujer', 'tienda online', 'PHALAY', 'fashion'],
  authors: [{ name: 'PHALAY' }],
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    alternateLocale: 'en_US',
    siteName: 'PHALAY',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const store = await getStoreData();

  // La sesión se lee en el servidor: tras iniciar sesión con un server action
  // la cookie ya existe aquí, así que la cabecera muestra a la clienta de
  // inmediato sin esperar a que el navegador recargue la página.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const initialUser = user
    ? {
        email: user.email ?? '',
        firstName: (user.user_metadata?.first_name as string) ?? '',
        lastName: (user.user_metadata?.last_name as string) ?? '',
      }
    : null;

  const storeName = store?.storeName || 'PHALAY';
  const storeDescription = store?.storeDescription || 'Moda que trasciende tendencias.';
  const socialLinks = store?.socialLinks || {};

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-dvh bg-gray-50 font-sans text-gray-900 antialiased flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Navbar initialStoreName={storeName} initialUser={initialUser} />
          <main className="flex-1 bg-[#F8F8F8]">
            {children}
          </main>
          <Footer initialStoreName={storeName} initialDescription={storeDescription} initialSocialLinks={socialLinks} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

