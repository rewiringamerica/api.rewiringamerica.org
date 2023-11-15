import { JSONSchemaType } from 'ajv';
import fs from 'fs';

// Source of this data:
// https://energizect.com/energy-evaluations/income-eligible-options

export enum CTLowIncomeAuthority {
  DEFAULT = 'default',
}

export type CTLowIncomeThresholdsMap = {
  [authority_name: string]: CTLowIncomeThresholdsAuthority;
};

export type CTLowIncomeThresholdsAuthority = {
  source_url: string;
  thresholds: CTLowIncomeThresholds;
};

export type CTLowIncomeThresholds = {
  [hhSize: string]: number;
};

export const AUTHORITY_THRESHOLDS_SCHEMA: JSONSchemaType<CTLowIncomeThresholds> =
  {
    type: 'object',
    required: ['1', '2', '3', '4', '5', '6', '7', '8'],
    additionalProperties: {
      type: 'number',
    },
  } as const;

export const AUTHORITY_INFO_SCHEMA: JSONSchemaType<CTLowIncomeThresholdsAuthority> =
  {
    type: 'object',
    properties: {
      source_url: { type: 'string' },
      thresholds: AUTHORITY_THRESHOLDS_SCHEMA,
    },
    required: ['source_url', 'thresholds'],
  } as const;

export const SCHEMA: JSONSchemaType<CTLowIncomeThresholdsMap> = {
  type: 'object',
  required: Object.values(CTLowIncomeAuthority),
  additionalProperties: AUTHORITY_INFO_SCHEMA,
};

export const CT_LOW_INCOME_THRESHOLDS_BY_AUTHORITY: CTLowIncomeThresholdsMap =
  JSON.parse(fs.readFileSync('./data/CT/low_income_thresholds.json', 'utf-8'));
