// =========================================
// Tipos de Usuario
// =========================================

import type { UUID, AuditMetadata, EntityStatus, UploadedFile } from './common';
import type { UserRole } from './auth';

/** Perfil completo de usuario */
export interface User extends AuditMetadata {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: EntityStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  locale: 'es' | 'en';
  lastLoginAt: Date | null;
  loginCount: number;
  metadata: UserMetadata | null;
}

/** Metadatos adicionales del usuario */
export interface UserMetadata {
  dateOfBirth?: string;
  gender?: 'female' | 'male' | 'other' | 'prefer_not_to_say';
  country?: string;
  city?: string;
  referralCode?: string;
  referredBy?: UUID;
  preferences?: UserPreferences;
}

/** Preferencias del usuario */
export interface UserPreferences {
  newsletter: boolean;
  promotionalEmails: boolean;
  orderNotifications: boolean;
  darkMode: boolean;
  currency: 'PEN' | 'USD';
}

/** Dirección de envío */
export interface ShippingAddress extends AuditMetadata {
  id: UUID;
  userId: UUID;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/** Datos para actualizar perfil */
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: UploadedFile;
  locale?: 'es' | 'en';
  metadata?: Partial<UserMetadata>;
}
