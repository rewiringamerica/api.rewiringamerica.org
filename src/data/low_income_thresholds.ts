import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';

export enum LowIncomeThresholdsType {
  HH_SIZE = 'hh-size',
  COUNTY_AND_HH_SIZE = 'county-and-hh-size',
  FILING_STATUS = 'filing-status',
}

export const HHSIZE_THRESHOLDS_SCHEMA = {
  type: 'object',
  patternProperties: {
    '^[1-9][0-9]*$': { type: 'number' },
  },
  additionalProperties: false,
} as const;

export const RANGE_SCHEMA = {
  type: 'array',
  items: {
    type: 'number',
    minimum: 0,
  },
  minItems: 2,
  maxItems: 2,
} as const;

export const AUTHORITY_INFO_SCHEMA = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    source_url: { type: 'string' },
  },
  required: ['source_url'],
  oneOf: [
    {
      properties: {
        type: {
          type: 'string',
          const: 'hhsize',
        },
        thresholds: HHSIZE_THRESHOLDS_SCHEMA,
      },
      required: ['type', 'thresholds'],
    },
    {
      properties: {
        type: {
          type: 'string',
          const: 'county-hhsize',
        },
        thresholds: {
          type: 'object',
          patternProperties: {
            // Keys are county FIPS codes: 5-digit numbers.
            '^\\d{5}$': HHSIZE_THRESHOLDS_SCHEMA,
            // Allow "other" as a fallback.
            '^other$': HHSIZE_THRESHOLDS_SCHEMA,
          },
          additionalProperties: false,
        },
      },
      required: ['type', 'thresholds'],
    },
    {
      properties: {
        type: {
          type: 'string',
          const: 'filing-status',
        },
        thresholds: {
          type: 'object',
          properties: {
            single: RANGE_SCHEMA,
            joint: RANGE_SCHEMA,
            married_filing_separately: RANGE_SCHEMA,
            hoh: RANGE_SCHEMA,
            qualifying_widower_with_dependent_child: RANGE_SCHEMA,
          },
          required: [
            'single',
            'joint',
            'married_filing_separately',
            'hoh',
            'qualifying_widower_with_dependent_child',
          ],
          additionalProperties: false,
        },
      },
      required: ['type', 'thresholds'],
    },
    {
      properties: {
        type: {
          type: 'string',
          const: 'ami-percentage',
        },
        thresholds: {
          type: 'object',
          properties: {
            percentage: {
              type: 'number',
              enum: [80, 150],
            },
          },
          required: ['percentage'],
          additionalProperties: false,
        },
      },
      required: ['type', 'thresholds'],
    },
    {
      properties: {
        type: {
          type: 'string',
          const: 'fpl-percentage',
        },
        thresholds: {
          type: 'object',
          properties: {
            percentage: { type: 'number' },
          },
          required: ['percentage'],
          additionalProperties: false,
        },
      },
      required: ['type', 'thresholds'],
    },
  ],
} as const;

export const SCHEMA = {
  type: 'object',
  required: [],
  additionalProperties: AUTHORITY_INFO_SCHEMA,
} as const;

export type LowIncomeThresholdsMap = FromSchema<typeof SCHEMA>;

export type LowIncomeThresholdsAuthority = FromSchema<
  typeof AUTHORITY_INFO_SCHEMA
>;

export type HHSizeThresholds = FromSchema<typeof HHSIZE_THRESHOLDS_SCHEMA>;

export const LOW_INCOME_THRESHOLDS: LowIncomeThresholdsMap = JSON.parse(
  fs.readFileSync('./data/low_income_thresholds.json', 'utf-8'),
);
