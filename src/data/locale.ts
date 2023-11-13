import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';
import { ALL_ITEMS, ITEMS_SCHEMA } from './types/items';

export const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'object',
      properties: ITEMS_SCHEMA,
      required: ALL_ITEMS,
      additionalProperties: false,
    },
    urls: {
      type: 'object',
      properties: ITEMS_SCHEMA,
      required: ALL_ITEMS,
      additionalProperties: false,
    },
  },
  required: ['items', 'urls'],
  additionalProperties: false,
} as const;

export type Locale = FromSchema<typeof SCHEMA>;

export const LOCALES = {
  en: JSON.parse(fs.readFileSync('./locales/en.json', 'utf-8')) as Locale,
  es: JSON.parse(fs.readFileSync('./locales/es.json', 'utf-8')) as Locale,
};
