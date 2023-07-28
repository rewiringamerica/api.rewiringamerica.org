import { JSONSchemaType } from 'ajv';
import fs from 'fs';

export type RILowIncomeThresholds = { [hhSize: string]: number };

export const SCHEMA: JSONSchemaType<RILowIncomeThresholds> = {
  type: 'object',
  required: ['1', '2', '3', '4', '5', '6', '7', '8'],
  additionalProperties: {
    type: 'number',
  },
};

export const RI_LOW_INCOME_THRESHOLDS: { [hhSize: number]: number } =
  JSON.parse(fs.readFileSync('./data/RI/low_income_thresholds.json', 'utf-8'));
