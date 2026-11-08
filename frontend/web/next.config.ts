import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { securityHeaders } from '@phalay/security';
import fs from 'fs';
import path from 'path';

// Cargar el único .env centralizado en la raíz del proyecto
try {
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(rootEnvPath)) {
    const content = fs.readFileSync(rootEnvPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Ignorar en entornos como Vercel donde las variables ya están inyectadas
}

// Impide que un valor antiguo de Render se inserte en el bundle público.
// La tienda debe comunicarse únicamente con el API independiente de Vercel.
if (process.env.VERCEL && /\.onrender\.com/i.test(process.env.NEXT_PUBLIC_API_URL || '')) {
  process.env.NEXT_PUBLIC_API_URL = 'https://phalay-api.vercel.app/api/v1';
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  },
  // Seguridad
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],

  // Imágenes optimizadas
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // Rendimiento
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@phalay/ui',
    ],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Transpile paquetes del monorepo
  transpilePackages: [
    '@phalay/ui',
    '@phalay/types',
    '@phalay/i18n',
    '@phalay/auth',
    '@phalay/security',
    '@phalay/database',
    '@phalay/services',
  ],
};

export default withNextIntl(nextConfig);
