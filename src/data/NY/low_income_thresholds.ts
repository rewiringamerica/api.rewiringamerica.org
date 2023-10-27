import { JSONSchemaType } from 'ajv';
import fs from 'fs';

// Source of this data:
// https://homeenergy.pseg.com/homeweatherization

export type NYLowIncomeThresholdsMap = {
  [authorityName: string]: NYLowIncomeThresholds;
};

export type NYLowIncomeThresholds = { [hhSize: string]: number };

export const AUTHORITY_THRESHOLDS_SCHEMA: JSONSchemaType<NYLowIncomeThresholds> =
  {
    type: 'object',
    required: ['1', '2', '3', '4', '5', '6', '7', '8'],
    additionalProperties: {
      type: 'number',
    },
  } as const;

export const SCHEMA: JSONSchemaType<NYLowIncomeThresholdsMap> = {
  type: 'object',
  required: ['default'],
  additionalProperties: AUTHORITY_THRESHOLDS_SCHEMA,
};

export const NY_LOW_INCOME_THRESHOLDS_BY_AUTHORITY: NYLowIncomeThresholdsMap =
  JSON.parse(fs.readFileSync('./data/NY/low_income_thresholds.json', 'utf-8'));
