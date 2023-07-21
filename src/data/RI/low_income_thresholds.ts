import { JSONSchemaType } from 'ajv';
import fs from 'fs';

// Source of this data:
// https://dhs.ri.gov/programs-and-services/energy-and-water-assistance-programs/ffy-2023-low-income-guidelines

export type RILowIncomeThresholds = { [hhSize: string]: number };

export const SCHEMA: JSONSchemaType<RILowIncomeThresholds> = {
  type: 'object',
  required: ['1', '2', '3', '4', '5', '6', '7', '8'],
  additionalProperties: {
    type: 'number',
  },
};

export const RI_LOW_INCOME_THRESHOLDS: RILowIncomeThresholds = JSON.parse(
  fs.readFileSync('./data/RI/low_income_thresholds.json', 'utf-8'),
);
