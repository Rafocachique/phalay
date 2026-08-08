// =========================================
// @phalay/auth - Autenticación Supabase
// =========================================

export { createBrowserClient } from './supabase-browser';
export { createServerClient } from './supabase-server';
export { authMiddleware } from './middleware';
export type { AuthSession } from './types';
