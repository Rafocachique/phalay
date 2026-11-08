import type { NextConfig } from 'next';
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

// Evita que una variable heredada del hosting anterior mantenga al panel
// conectado a Render. La variable correcta debe actualizarse en Vercel, pero
// este resguardo impide regresiones durante la transición.
if (process.env.VERCEL && /\.onrender\.com/i.test(process.env.NEXT_PUBLIC_API_URL || '')) {
  process.env.NEXT_PUBLIC_API_URL = 'https://phalay-api.vercel.app/api/v1';
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],
  transpilePackages: [
    '@phalay/ui',
    '@phalay/types',
    '@phalay/auth',
    '@phalay/security',
    '@phalay/database',
    '@phalay/services',
  ],
  images: { formats: ['image/avif', 'image/webp'] },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
