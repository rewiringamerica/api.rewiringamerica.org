import { Locale, LOCALES } from '../data/locale';
import { LocalizableString } from '../data/types/localizable-string';

// FIXME: if we get tempted to start optimizing this, use a real i18n library
// looked at fastify-polyglot but it didn't have good docs on switching locale

export function t<
  TCategory extends keyof Locale,
  TKey extends keyof Locale[TCategory],
>(
  category: TCategory,
  key: TKey,
  locale: keyof typeof LOCALES = 'en',
): Locale[TCategory][TKey] {
  return LOCALES[locale][category][key];
}

export function tr(
  lstr: LocalizableString,
  locale: keyof typeof LOCALES = 'en',
): string {
  return lstr[locale] ?? lstr.en;
}
