import { JSONSchemaType } from 'ajv';
import fs from 'fs';
import { ALL_ITEMS, ITEMS_SCHEMA } from './types/items';
import { ALL_PROGRAMS, PROGRAMS_SCHEMA } from './types/programs';

export type Items = {
  [k in keyof typeof ITEMS_SCHEMA]: string;
};

export type Programs = {
  [k in keyof typeof PROGRAMS_SCHEMA]: string;
};

export interface Locale {
  items: Items;
  programs: Programs;
  urls: Items;
}

export const SCHEMA: JSONSchemaType<Locale> = {
  type: 'object',
  properties: {
    items: {
      type: 'object',
      properties: ITEMS_SCHEMA,
      required: ALL_ITEMS,
    },
    programs: {
      type: 'object',
      properties: PROGRAMS_SCHEMA,
      required: ALL_PROGRAMS,
    },
    urls: {
      type: 'object',
      properties: ITEMS_SCHEMA,
      required: ALL_ITEMS,
    },
  },
  required: ['items', 'programs', 'urls'],
};

export const LOCALES = {
  en: JSON.parse(fs.readFileSync('./locales/en.json', 'utf-8')) as Locale,
  es: JSON.parse(fs.readFileSync('./locales/es.json', 'utf-8')) as Locale,
};
