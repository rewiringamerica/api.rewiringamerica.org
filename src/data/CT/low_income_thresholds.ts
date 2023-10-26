import { JSONSchemaType } from 'ajv';
import fs from 'fs';

// Source of this data:
// https://energizect.com/energy-evaluations/income-eligible-options

export type CTLowIncomeThresholdsMap = {
  [authorityName: string]: CTLowIncomeThresholds;
};

export type CTLowIncomeThresholds = { [hhSize: string]: number };

export const AUTHORITY_THRESHOLDS_SCHEMA: JSONSchemaType<CTLowIncomeThresholds> =
  {
    type: 'object',
    required: ['1', '2', '3', '4', '5', '6', '7', '8'],
    additionalProperties: {
      type: 'number',
    },
  } as const;

export const SCHEMA: JSONSchemaType<CTLowIncomeThresholdsMap> = {
  type: 'object',
  required: ['default'],
  additionalProperties: AUTHORITY_THRESHOLDS_SCHEMA,
};

export const CT_LOW_INCOME_THRESHOLDS_BY_AUTHORITY: CTLowIncomeThresholdsMap =
  JSON.parse(fs.readFileSync('./data/CT/low_income_thresholds.json', 'utf-8'));
