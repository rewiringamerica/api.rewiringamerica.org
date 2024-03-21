import { JSONSchemaType } from 'ajv';
import fs from 'fs';

export type LowIncomeThresholdsMap = {
  [state: string]: StateLowIncomeThresholds;
};

export type StateLowIncomeThresholds = {
  [authority_name: string]: LowIncomeThresholdsAuthority;
};

export type LowIncomeThresholdsAuthority = {
  source_url: string;
  thresholds: LowIncomeThresholds;
  incentives: string[];
};

export type LowIncomeThresholds = {
  [hhSize: string]: number;
};

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

export const AUTHORITY_THRESHOLDS_SCHEMA: JSONSchemaType<LowIncomeThresholds> =
  {
    type: 'object',
    required: ['1', '2', '3', '4', '5', '6', '7', '8'],
    additionalProperties: {
      type: 'number',
    },
  } as const;

export const AUTHORITY_INFO_SCHEMA: JSONSchemaType<LowIncomeThresholdsAuthority> =
  {
    type: 'object',
    properties: {
      source_url: { type: 'string' },
      thresholds: AUTHORITY_THRESHOLDS_SCHEMA,
      incentives: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        uniqueItems: true,
      },
    },
    required: ['source_url', 'thresholds', 'incentives'],
  } as const;

export const STATE_THRESHOLDS_SCHEMA: JSONSchemaType<StateLowIncomeThresholds> =
  {
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
  };

// Keep states in alphabetic order.
export const SCHEMA: JSONSchemaType<LowIncomeThresholdsMap> = {
  type: 'object',
  required: [
    'AZ',
    'CO',
    'CT',
    'GA',
    'IL',
    'MI',
    'NV',
    'NY',
    'OR',
    'PA',
    'RI',
    'VA',
    'VT',
    'WI',
  ],
  additionalProperties: STATE_THRESHOLDS_SCHEMA,
};

export const LOW_INCOME_THRESHOLDS_BY_AUTHORITY: LowIncomeThresholdsMap =
  JSON.parse(fs.readFileSync('./data/low_income_thresholds.json', 'utf-8'));
