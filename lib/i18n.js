import EN_STRINGS from '../locales/en.json' assert { type: 'json' };
import ES_STRINGS from '../locales/es.json' assert { type: 'json' };

// FIXME: if we get tempted to start optimizing this, use a real i18n library
// looked at fastify-polyglot but it didn't have good docs on switching locale

export const LOCALES = {
  en: EN_STRINGS,
  es: ES_STRINGS
};

export function walk(object, [key, ...rest]) {
  if (rest.length == 0) {
    return object[key];
  } else {
    return walk(object[key], rest);
  }
}

export function t(key, locale = 'en') {
  return walk(LOCALES[locale], key.split('.'));
}
