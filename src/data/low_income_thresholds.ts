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
      RI: {
        required: Object.values(RILowIncomeAuthority),
      },
    },
    additionalProperties: AUTHORITY_INFO_SCHEMA,
  };

export const SCHEMA: JSONSchemaType<LowIncomeThresholdsMap> = {
  type: 'object',
  required: ['CT', 'NY', 'RI'],
  additionalProperties: STATE_THRESHOLDS_SCHEMA,
};

export const LOW_INCOME_THRESHOLDS_BY_AUTHORITY: LowIncomeThresholdsMap =
  JSON.parse(fs.readFileSync('./data/low_income_thresholds.json', 'utf-8'));
