// =========================================
// Sanitización de Inputs - Protección XSS
// =========================================

import DOMPurify from 'isomorphic-dompurify';

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapa caracteres peligrosos para prevenir XSS
 */
export function escapeXss(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitiza input de texto removiendo etiquetas HTML
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remover etiquetas HTML
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .replace(/data:/gi, '') // Remover data: URIs
    .trim();
}

/**
 * Sanitiza HTML permitiendo solo etiquetas seguras.
 * Usa DOMPurify (parser DOM real) en vez de regex sobre el string, ya que
 * un parser basado en regex no captura HTML malformado/atributos sin
 * comillas (ej. <span onerror=alert(1)>) y puede dejar pasar XSS.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
  });
}
