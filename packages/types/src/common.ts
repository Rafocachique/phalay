// =========================================
// Tipos Comunes Reutilizables
// =========================================

/** Identificador único universal */
export type UUID = string;

/** Timestamps de auditoría presentes en todas las entidades */
export interface AuditTimestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Metadatos de auditoría completa */
export interface AuditMetadata extends AuditTimestamps {
  createdBy: UUID | null;
  updatedBy: UUID | null;
}

/** Respuesta paginada estándar */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Metadatos de paginación */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Parámetros de consulta para paginación */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/** Respuesta estándar de la API */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/** Respuesta de error de la API */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

/** Idiomas soportados */
export type SupportedLocale = 'es' | 'en';

/** Estado genérico */
export type EntityStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/** Moneda soportada */
export type Currency = 'PEN' | 'USD';

/** Formato de imagen soportado */
export type ImageFormat = 'webp' | 'jpg' | 'png';

/** Información de archivo subido */
export interface UploadedFile {
  id: UUID;
  url: string;
  signedUrl?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  format: ImageFormat;
  width?: number;
  height?: number;
}
