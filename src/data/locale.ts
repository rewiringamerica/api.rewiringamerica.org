import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';
import { ALL_ITEMS, ITEMS_SCHEMA } from './types/items';
import { ALL_PROGRAMS, PROGRAMS_SCHEMA } from './types/programs';

export const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'object',
      properties: ITEMS_SCHEMA,
      required: ALL_ITEMS,
      additionalProperties: false,
    },
    programs: {
      type: 'object',
      properties: PROGRAMS_SCHEMA,
      required: ALL_PROGRAMS,
      additionalProperties: false,
    },
    urls: {
      type: 'object',
      properties: ITEMS_SCHEMA,
      required: ALL_ITEMS,
      additionalProperties: false,
    },
    program_urls: {
      type: 'object',
      properties: PROGRAMS_SCHEMA,
      required: [],
      additionalProperties: false,
    },
  },
  required: ['items', 'programs', 'urls', 'program_urls'],
  additionalProperties: false,
} as const;

export type Locale = FromSchema<typeof SCHEMA>;

export const LOCALES = {
  en: JSON.parse(fs.readFileSync('./locales/en.json', 'utf-8')) as Locale,
  es: JSON.parse(fs.readFileSync('./locales/es.json', 'utf-8')) as Locale,
};
