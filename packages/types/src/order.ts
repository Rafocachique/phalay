// =========================================
// Tipos de Orden / Pedido
// =========================================

import type { UUID, AuditMetadata, Currency } from './common';
import type { ShippingAddress } from './user';
import type { PaymentMethodType } from './payment';

/** Orden / Pedido */
export interface Order extends AuditMetadata {
  id: UUID;
  orderNumber: string;
  customerId: UUID;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  currency: Currency;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  notes: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
}

/** Estado del pedido */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'returned';

/** Estado de pago */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

/** Item de la orden */
export interface OrderItem {
  id: UUID;
  orderId: UUID;
  productId: UUID;
  variantId: UUID | null;
  productName: string;
  variantName: string | null;
  sku: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  size: string | null;
  color: string | null;
}

/** Datos para crear orden */
export interface CreateOrderInput {
  items: Array<{
    productId: UUID;
    variantId?: UUID;
    quantity: number;
  }>;
  shippingAddressId: UUID;
  paymentMethod: PaymentMethodType;
  notes?: string;
  couponCode?: string;
}

/** Timeline de la orden */
export interface OrderTimeline {
  id: UUID;
  orderId: UUID;
  status: OrderStatus;
  description: string;
  createdAt: Date;
  createdBy: UUID | null;
}
