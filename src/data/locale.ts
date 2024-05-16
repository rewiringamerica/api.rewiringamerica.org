import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';
import {
  ALL_ERROR_MESSAGES,
  ERROR_MESSAGES_SCHEMA,
} from './types/error-message';
import { IRA_ITEMS, IRA_ITEMS_SCHEMA } from './types/items';

export const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'object',
      properties: IRA_ITEMS_SCHEMA,
      required: IRA_ITEMS,
      additionalProperties: false,
    },
    urls: {
      type: 'object',
      properties: IRA_ITEMS_SCHEMA,
      required: IRA_ITEMS,
      additionalProperties: false,
    },
    errors: {
      type: 'object',
      properties: ERROR_MESSAGES_SCHEMA,
      required: ALL_ERROR_MESSAGES,
      additionalProperties: false,
    },
  },
  required: ['items', 'urls', 'errors'],
  additionalProperties: false,
} as const;

export type Locale = FromSchema<typeof SCHEMA>;

export const LOCALES = {
  en: JSON.parse(fs.readFileSync('./locales/en.json', 'utf-8')) as Locale,
  es: JSON.parse(fs.readFileSync('./locales/es.json', 'utf-8')) as Locale,
};
