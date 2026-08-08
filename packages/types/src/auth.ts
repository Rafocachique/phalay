// =========================================
// Tipos de Autenticación y Sesión
// =========================================

import type { UUID } from './common';

/** Roles del sistema */
export type UserRole = 'customer' | 'seller' | 'admin' | 'super_admin';

/** Proveedor de autenticación */
export type AuthProvider = 'email' | 'google' | 'apple';

/** Payload del JWT decodificado */
export interface JwtPayload {
  sub: UUID;
  email: string;
  role: UserRole;
  sessionId: UUID;
  iat: number;
  exp: number;
}

/** Datos para registro de usuario */
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'seller';
  locale?: 'es' | 'en';
}

/** Datos para inicio de sesión */
export interface LoginInput {
  email: string;
  password: string;
  deviceInfo?: DeviceInfo;
}

/** Información del dispositivo para seguridad */
export interface DeviceInfo {
  userAgent: string;
  ip: string;
  platform: string;
  fingerprint?: string;
}

/** Resultado de autenticación exitosa */
export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** Usuario autenticado (datos mínimos) */
export interface AuthUser {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
}

/** Sesión activa */
export interface UserSession {
  id: UUID;
  userId: UUID;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

/** Solicitud de recuperación de contraseña */
export interface PasswordResetRequest {
  email: string;
}

/** Solicitud de verificación OTP */
export interface OtpVerification {
  email: string;
  code: string;
  type: 'email_verification' | 'password_reset' | 'login_verification';
}
