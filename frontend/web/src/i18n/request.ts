// =========================================
// Configuración de next-intl (request)
// =========================================

import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, type Locale, getMessages } from '@phalay/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = ((await requestLocale) || defaultLocale) as Locale;

  return {
    locale,
    messages: await getMessages(locale),
  };
});
