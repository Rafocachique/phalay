// =========================================
// Schemas de Validación Zod - Dominio
// =========================================

import { z } from 'zod';

// ── Auth ──
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido').max(255),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
});

export const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido').max(255),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(100).trim(),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(100).trim(),
  phone: z.string().optional(),
  role: z.enum(['customer', 'seller']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// ── Productos ──
export const createProductSchema = z.object({
  categoryId: z.string().uuid('ID de categoría inválido'),
  name: z.string().min(3, 'Mínimo 3 caracteres').max(200).trim(),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(5000).trim(),
  shortDescription: z.string().max(300).optional(),
  sku: z.string().min(3).max(50).trim(),
  price: z.number().positive('El precio debe ser positivo').max(999999),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  tags: z.array(z.string().max(50)).max(20).optional(),
  weight: z.number().positive().optional(),
  featured: z.boolean().default(false),
});

// ── Tiendas ──
export const createStoreSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(100).trim(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().max(1000).optional(),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    instagram: z.string().optional(),
  }),
});

// ── Paginación ──
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200).optional(),
});

// ── Archivos ──
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const fileUploadSchema = z.object({
  filename: z.string().max(255),
  mimeType: z.string().refine((mime) => ALLOWED_MIMES.includes(mime), {
    message: 'Formato no permitido. Usa: JPG, PNG, WebP o AVIF',
  }),
  size: z.number().max(MAX_FILE_SIZE, 'El archivo no puede exceder 10MB'),
});
