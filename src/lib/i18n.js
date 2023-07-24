import { LOCALES } from '../data/locale.js';

// FIXME: if we get tempted to start optimizing this, use a real i18n library
// looked at fastify-polyglot but it didn't have good docs on switching locale

export function walk(object, [key, ...rest]) {
  if (rest.length === 0) {
    return object[key];
  } else {
    return walk(object[key], rest);
  }
}

export function t(key, locale = 'en') {
  return walk(LOCALES[locale], key.split('.'));
}
