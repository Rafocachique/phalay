// =========================================
// @phalay/i18n - Configuración Multi-Idioma
// =========================================

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  es: '🇪🇸',
  en: '🇺🇸',
};

/**
 * Carga los mensajes de un locale específico
 */
export async function getMessages(locale: Locale) {
  return (await import(`./messages/${locale}.json`)).default;
}

/**
 * Configuración para next-intl
 */
export const i18nConfig = {
  locales,
  defaultLocale,
  localePrefix: 'as-needed' as const,
};
