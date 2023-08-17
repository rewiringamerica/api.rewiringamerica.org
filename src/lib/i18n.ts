import { Locale, LOCALES } from '../data/locale';

// FIXME: if we get tempted to start optimizing this, use a real i18n library
// looked at fastify-polyglot but it didn't have good docs on switching locale

export function t(
  category: keyof Locale,
  key: string,
  locale: keyof typeof LOCALES = 'en',
): string {
  return (LOCALES[locale][category] as { [k: string]: string })[key];
}
