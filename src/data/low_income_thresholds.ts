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
    },
    required: ['source_url', 'thresholds'],
  } as const;

export const STATE_THRESHOLDS_SCHEMA: JSONSchemaType<StateLowIncomeThresholds> =
  {
    type: 'object',
    required: ['default'],
    dependentSchemas: {
      CO: {
        required: Object.values(COLowIncomeAuthority),
      },
      IL: {
        required: Object.values(ILIncomeAuthority),
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
  required: ['AZ', 'CO', 'CT', 'IL', 'MI', 'NV', 'NY', 'RI', 'VA', 'VT'],
  additionalProperties: STATE_THRESHOLDS_SCHEMA,
};

export const LOW_INCOME_THRESHOLDS_BY_AUTHORITY: LowIncomeThresholdsMap =
  JSON.parse(fs.readFileSync('./data/low_income_thresholds.json', 'utf-8'));
