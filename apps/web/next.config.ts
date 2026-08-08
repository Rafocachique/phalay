import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { securityHeaders } from '@phalay/security';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
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
  ],
};

export default withNextIntl(nextConfig);
