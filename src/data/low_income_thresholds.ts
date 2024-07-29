import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';

export enum LowIncomeThresholdsType {
  HH_SIZE = 'hh-size',
  COUNTY_AND_HH_SIZE = 'county-and-hh-size',
  FILING_STATUS = 'filing-status',
}

// Add custom state low income authorities here
export enum COLowIncomeAuthority {
  DENVER = 'co-city-and-county-of-denver',
  ENERGY_OUTREACH = 'co-energy-outreach-colorado',
  ENERGY_OFFICE = 'co-colorado-energy-office',
  BOULDER = 'co-city-of-boulder',
  WALKING_MOUNTAINS = 'co-walking-mountains',
}

export enum ILIncomeAuthority {
  STATE = 'il-state-of-illinois',
}

export enum NVLowIncomeAuthority {
  CSA_RENO = 'nv-csa-reno',
  RURAL_NEVADA_DEVELOPMENT_CO = 'nv-rural-nevada-development-corporation',
  NV_RURAL_HOUSING = 'nv-nevada-rural-housing',
  HELP_OF_SOUTHERN_NV = 'nv-help-of-southern-nevada',
}

export enum RILowIncomeAuthority {
  DHS = 'ri-dhs',
  ENERGY = 'ri-rhode-island-energy',
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
    source_url: { type: 'string' },
    incentives: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      uniqueItems: true,
    },
  },
  required: ['source_url', 'incentives'],
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
        percentage: {
          type: 'number',
          enum: [80, 150],
        },
      },
      required: ['type', 'percentage'],
    },
  ],
} as const;

export const STATE_THRESHOLDS_SCHEMA = {
  type: 'object',
  required: [],
  dependentSchemas: {
    CO: {
      required: Object.values(COLowIncomeAuthority),
    },
    IL: {
      required: Object.values(ILIncomeAuthority),
    },
    NV: {
      required: Object.values(NVLowIncomeAuthority),
    },
    RI: {
      required: Object.values(RILowIncomeAuthority),
    },
  },
  additionalProperties: AUTHORITY_INFO_SCHEMA,
} as const;

export const SCHEMA = {
  type: 'object',
  additionalProperties: STATE_THRESHOLDS_SCHEMA,
} as const;

export type LowIncomeThresholdsMap = FromSchema<typeof SCHEMA>;

export type StateLowIncomeThresholds = FromSchema<
  typeof STATE_THRESHOLDS_SCHEMA
>;

export type LowIncomeThresholdsAuthority = FromSchema<
  typeof AUTHORITY_INFO_SCHEMA
>;

export type HHSizeThresholds = FromSchema<typeof HHSIZE_THRESHOLDS_SCHEMA>;

export const LOW_INCOME_THRESHOLDS_BY_STATE: LowIncomeThresholdsMap =
  JSON.parse(fs.readFileSync('./data/low_income_thresholds.json', 'utf-8'));
