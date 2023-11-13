import { JSONSchemaType } from 'ajv';
import fs from 'fs';

// Source of this data:
// https://www.dhcd.virginia.gov/sites/default/files/Docx/weatherization/income-limits.pdf

export type VALowIncomeThresholdsMap = {
  [authorityName: string]: VALowIncomeThresholds;
};

export type VALowIncomeThresholds = { [hhSize: string]: number };

export const AUTHORITY_THRESHOLDS_SCHEMA: JSONSchemaType<VALowIncomeThresholds> =
  {
    type: 'object',
    required: ['1', '2', '3', '4', '5', '6', '7', '8'],
    additionalProperties: {
      type: 'number',
    },
  } as const;

export const SCHEMA: JSONSchemaType<VALowIncomeThresholdsMap> = {
  type: 'object',
  required: ['default'],
  additionalProperties: AUTHORITY_THRESHOLDS_SCHEMA,
};

export const VA_LOW_INCOME_THRESHOLDS_BY_AUTHORITY: VALowIncomeThresholdsMap =
  JSON.parse(fs.readFileSync('./data/VA/low_income_thresholds.json', 'utf-8'));
