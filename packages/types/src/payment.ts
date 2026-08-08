// =========================================
// Tipos de Pago
// =========================================

import type { UUID, AuditMetadata } from './common';

/** Método de pago disponible */
export type PaymentMethodType =
  | 'stripe'
  | 'mercadopago'
  | 'culqi'
  | 'niubiz'
  | 'yape'
  | 'cash_on_delivery';

/** Pasarela de pago */
export type PaymentGateway = 'stripe' | 'mercadopago' | 'culqi' | 'niubiz';

/** Registro de pago */
export interface Payment extends AuditMetadata {
  id: UUID;
  orderId: UUID;
  customerId: UUID;
  method: PaymentMethodType;
  gateway: PaymentGateway | null;
  status: PaymentTransactionStatus;
  amount: number;
  currency: string;
  gatewayTransactionId: string | null;
  gatewayResponse: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  failureReason: string | null;
}

/** Estado de transacción de pago */
export type PaymentTransactionStatus =
  | 'initiated'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

/** Pago por Yape */
export interface YapePayment extends AuditMetadata {
  id: UUID;
  orderId: UUID;
  customerId: UUID;
  qrCodeUrl: string;
  approvalCode: string | null;
  receiptUrl: string | null;
  status: YapePaymentStatus;
  amount: number;
  verifiedAt: Date | null;
  verifiedBy: UUID | null;
  rejectionReason: string | null;
}

/** Estado del pago Yape */
export type YapePaymentStatus =
  | 'pending_upload'
  | 'pending_verification'
  | 'verified'
  | 'rejected'
  | 'expired';

/** Datos para iniciar pago */
export interface InitiatePaymentInput {
  orderId: UUID;
  method: PaymentMethodType;
  returnUrl?: string;
  cancelUrl?: string;
}

/** Datos para verificar pago Yape */
export interface VerifyYapePaymentInput {
  paymentId: UUID;
  approvalCode: string;
  receiptUrl: string;
}
