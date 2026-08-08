// =========================================
// Tipos de Producto
// =========================================

import type { UUID, AuditMetadata, Currency, UploadedFile } from './common';

/** Producto principal */
export interface Product extends AuditMetadata {
  id: UUID;
  categoryId: UUID;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  sku: string;
  status: ProductStatus;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  currency: Currency;
  images: ProductImage[];
  variants: ProductVariant[];
  tags: string[];
  weight: number | null;
  dimensions: ProductDimensions | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featured: boolean;
  rating: number;
  reviewCount: number;
  totalSold: number;
  viewCount: number;
}

/** Estado del producto */
export type ProductStatus = 'draft' | 'active' | 'archived' | 'out_of_stock';

/** Imagen del producto */
export interface ProductImage {
  id: UUID;
  url: string;
  altText: string | null;
  position: number;
  isMain: boolean;
}

/** Variante del producto (talla, color) */
export interface ProductVariant {
  id: UUID;
  productId: UUID;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  imageUrl: string | null;
  isActive: boolean;
  position: number;
}

/** Dimensiones del producto */
export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

/** Categoría de producto */
export interface ProductCategory extends AuditMetadata {
  id: UUID;
  parentId: UUID | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
  isActive: boolean;
  children?: ProductCategory[];
  productCount?: number;
}

/** Datos para crear producto */
export interface CreateProductInput {
  categoryId: UUID;
  name: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  currency?: Currency;
  tags?: string[];
  weight?: number;
  dimensions?: ProductDimensions;
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  variants?: CreateVariantInput[];
}

/** Datos para crear variante */
export interface CreateVariantInput {
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  size?: string;
  color?: string;
  colorHex?: string;
}

/** Filtros de búsqueda de productos */
export interface ProductFilters {
  categoryId?: UUID;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  featured?: boolean;
  search?: string;
  sortBy?: 'price' | 'newest' | 'popular' | 'rating';
  sortOrder?: 'asc' | 'desc';
}
