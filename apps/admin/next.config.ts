import type { NextConfig } from 'next';
import { securityHeaders } from '@phalay/security';

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],
  transpilePackages: ['@phalay/ui', '@phalay/types', '@phalay/auth', '@phalay/security'],
  images: { formats: ['image/avif', 'image/webp'] },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
