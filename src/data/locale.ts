import fs from 'fs';
import { JSONSchemaType } from 'ajv';
import { ALL_ITEMS, ITEMS_SCHEMA } from './items.js';

export type Items = {
  [k in keyof typeof ITEMS_SCHEMA]: string;
};

const programsSchema = {
  alternativeFuelVehicleRefuelingPropertyCredit: { type: 'string' },
  cleanVehicleCredit: { type: 'string' },
  creditForPreviouslyOwnedCleanVehicles: { type: 'string' },
  energyEfficientHomeImprovementCredit: { type: 'string' },
  HEEHR: { type: 'string' },
  hopeForHomes: { type: 'string' },
  residentialCleanEnergyCredit: { type: 'string' },
} as const;
const allPrograms = Object.keys(
  programsSchema,
) as unknown as (keyof typeof programsSchema)[];

export type Programs = {
  [k in keyof typeof programsSchema]: string;
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
      properties: programsSchema,
      required: allPrograms,
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
