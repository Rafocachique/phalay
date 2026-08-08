// =========================================
// Tipos de Tienda (Store / Tenant)
// =========================================

import type { UUID, AuditMetadata, EntityStatus } from './common';

/** Tienda (tenant) del vendedor */
export interface Store extends AuditMetadata {
  id: UUID;
  ownerId: UUID;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: StoreStatus;
  verified: boolean;
  rating: number;
  totalSales: number;
  totalProducts: number;
  settings: StoreSettings;
  contact: StoreContact;
  branding: StoreBranding;
}

/** Estado de la tienda */
export type StoreStatus = 'pending_approval' | 'active' | 'suspended' | 'closed';

/** Configuración de la tienda */
export interface StoreSettings {
  currency: 'PEN' | 'USD';
  locale: 'es' | 'en';
  shippingEnabled: boolean;
  pickupEnabled: boolean;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  autoAcceptOrders: boolean;
  notificationEmail: string;
  returnPolicy?: string;
  termsOfService?: string;
}

/** Contacto de la tienda */
export interface StoreContact {
  email: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
}

/** Branding personalizable */
export interface StoreBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
  customCss?: string;
}

/** Datos para crear tienda */
export interface CreateStoreInput {
  name: string;
  slug: string;
  description?: string;
  contact: StoreContact;
  settings?: Partial<StoreSettings>;
}

/** Datos para actualizar tienda */
export interface UpdateStoreInput {
  name?: string;
  description?: string;
  settings?: Partial<StoreSettings>;
  contact?: Partial<StoreContact>;
  branding?: Partial<StoreBranding>;
}

/** Analíticas de la tienda */
export interface StoreAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    productId: UUID;
    name: string;
    sales: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}
