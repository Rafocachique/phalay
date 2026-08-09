import { Inter, Playfair_Display } from 'next/font/google';
import AdminShell from '@/components/AdminShell';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata = {
  title: 'PHALAY - Panel de Administración',
  description: 'Panel administrativo para la gestión de Phalay.',
};

import { headers } from 'next/headers';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const user = {
    id: headersList.get('x-user-id'),
    role: headersList.get('x-user-role'),
    firstName: headersList.get('x-user-first-name'),
    lastName: headersList.get('x-user-last-name'),
    email: headersList.get('x-user-email'),
  };

  // Sin h-full en <html>: junto al min-h-screen del body desbordaban los dos
  // y el navegador dibujaba dos barras de scroll.
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-screen bg-gradient-to-br from-[#F8F8F8] to-[#F0EDED] font-sans text-gray-900 antialiased w-full"
        suppressHydrationWarning
      >
        <AdminShell user={user}>{children}</AdminShell>
      </body>
    </html>
  );
}
