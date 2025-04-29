import fs from 'fs';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';

// Data source:
// https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines

const FPL_TABLE_SCHEMA = {
  type: 'object',
  properties: {
    levels_by_hhsize: {
      type: 'array',
      items: { type: 'number' },
      // Levels are defined for hhsizes 1 through 8. The first element of the
      // array is ignored so it can be indexed by hhsize.
      minItems: 9,
      maxItems: 9,
    },
    per_additional: { type: 'number' },
  },
  required: ['levels_by_hhsize', 'per_additional'],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const FEDERAL_POVERTY_LEVELS_SCHEMA = {
  type: 'object',
  properties: {
    AK: FPL_TABLE_SCHEMA,
    HI: FPL_TABLE_SCHEMA,
    other: FPL_TABLE_SCHEMA,
  },
  required: ['AK', 'HI', 'other'],
  additionalProperties: false,
} as const satisfies JSONSchema;

export type FederalPovertyLevels = FromSchema<
  typeof FEDERAL_POVERTY_LEVELS_SCHEMA
>;
export const FEDERAL_POVERTY_LEVELS: FederalPovertyLevels = JSON.parse(
  fs.readFileSync('./data/federal_poverty_levels.json', 'utf-8'),
);
