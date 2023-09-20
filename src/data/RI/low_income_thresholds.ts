import { JSONSchemaType } from 'ajv';
import fs from 'fs';

// Source of this data:
// https://dhs.ri.gov/programs-and-services/energy-and-water-assistance-programs/ffy-2023-low-income-guidelines
// https://www.rienergy.com/RI-Home/Energy-Saving-Programs/Income-Eligible-Services#qualify

export type RILowIncomeThresholdsList = {
  [authorityName: string]: RILowIncomeThresholds;
};

export type RILowIncomeThresholds = {
  [hhSize: string]: number;
};

export type AuthorityThresholds = {
  type: 'object';
  required: ['1', '2', '3', '4', '5', '6', '7', '8'];
  additionalProperties: {
    type: 'number';
  };
};

export const SCHEMA: JSONSchemaType<{
  [authorityName: string]: AuthorityThresholds;
}> = {
  type: 'object',
  required: ['default', 'ri-dhs', 'ri-rhode-island-energy'],
};

export const RI_LOW_INCOME_THRESHOLDS_BY_AUTHORITY: RILowIncomeThresholdsList =
  JSON.parse(fs.readFileSync('./data/RI/low_income_thresholds.json', 'utf-8'));
