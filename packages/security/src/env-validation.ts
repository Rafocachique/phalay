// =========================================
// Validación de Variables de Entorno
// Falla en build si faltan variables críticas
// =========================================

import { z } from 'zod';

export const envSchema = z.object({
  // Entorno
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('URL de Supabase inválida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Anon Key de Supabase requerida'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Service Role Key requerida').optional(),

  // Base de datos
  DATABASE_URL: z.string().min(1, 'DATABASE_URL requerida'),

  // Redis
  REDIS_URL: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),

  // API
  NEXT_PUBLIC_API_URL: z.string().url('URL de API inválida'),
  API_PORT: z.coerce.number().default(4000),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url('URL de App inválida'),

  // Seguridad
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY debe tener al menos 32 caracteres').optional(),
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Valida las variables de entorno al inicio de la aplicación.
 * Si faltan variables críticas, lanza un error descriptivo.
 */
export function validateEnv(env: Record<string, string | undefined>): EnvConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const message = Object.entries(errors)
      .map(([key, msgs]) => `  ❌ ${key}: ${msgs?.join(', ')}`)
      .join('\n');

    throw new Error(
      `\n╔══════════════════════════════════════════╗\n` +
      `║   ⚠️  ERROR: Variables de entorno         ║\n` +
      `╚══════════════════════════════════════════╝\n\n` +
      `${message}\n\n` +
      `Copia .env.example a .env.local y completa los valores.\n`,
    );
  }

  return result.data;
}
