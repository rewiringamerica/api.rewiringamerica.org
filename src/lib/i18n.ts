import { Locale, LOCALES } from '../data/locale';
import { LocalizableString } from '../data/types/localizable-string';

// FIXME: if we get tempted to start optimizing this, use a real i18n library
// looked at fastify-polyglot but it didn't have good docs on switching locale

export function t<TCategory extends keyof Locale>(
  category: TCategory,
  key: keyof Locale[TCategory],
  locale: keyof typeof LOCALES = 'en',
): string {
  return (LOCALES[locale][category] as { [k: string]: string })[key as string];
}

export function tr(
  lstr: LocalizableString,
  locale: keyof typeof LOCALES = 'en',
): string {
  return lstr[locale] ?? lstr.en;
}
