import { JSONSchemaType } from 'ajv';
import fs from 'fs';

// Source of this data:
// https://dhs.ri.gov/programs-and-services/energy-and-water-assistance-programs/ffy-2023-low-income-guidelines
// https://www.rienergy.com/RI-Home/Energy-Saving-Programs/Income-Eligible-Services#qualify

export type RILowIncomeThresholdsMap = {
  [authority_name: string]: RILowIncomeThresholdsAuthority;
};

export type RILowIncomeThresholdsAuthority = {
  source_url: string;
  thresholds: RILowIncomeThresholds;
};

export type RILowIncomeThresholds = {
  [hhSize: string]: number;
};

export const AUTHORITY_THRESHOLDS_SCHEMA: JSONSchemaType<RILowIncomeThresholds> =
  {
    type: 'object',
    required: ['1', '2', '3', '4', '5', '6', '7', '8'],
    additionalProperties: {
      type: 'number',
    },
  } as const;

export const AUTHORITY_INFO_SCHEMA: JSONSchemaType<RILowIncomeThresholdsAuthority> =
  {
    type: 'object',
    properties: {
      source_url: { type: 'string' },
      thresholds: AUTHORITY_THRESHOLDS_SCHEMA,
    },
    required: ['source_url', 'thresholds'],
  } as const;

export const SCHEMA: JSONSchemaType<RILowIncomeThresholdsMap> = {
  type: 'object',
  required: ['default', 'ri-dhs', 'ri-rhode-island-energy'],
  additionalProperties: AUTHORITY_INFO_SCHEMA,
};

export const RI_LOW_INCOME_THRESHOLDS_BY_AUTHORITY: RILowIncomeThresholdsMap =
  JSON.parse(fs.readFileSync('./data/RI/low_income_thresholds.json', 'utf-8'));
