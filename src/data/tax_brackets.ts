import { JSONSchemaType } from 'ajv';
import fs from 'fs';

export type TaxBracket = {
  filing_status: FilingStatus;
  income_max: number;
  income_min: number;
  standard_deduction: number;
  tax_rate: number;
};

export enum FilingStatus {
  HoH = 'hoh',
  Joint = 'joint',
  MarriedFilingSeparately = 'married_filing_separately',
  Single = 'single',
  Widower = 'widower_surviving_spouse',
}

const propertySchema = {
  filing_status: { type: 'string', enum: Object.values(FilingStatus) },
  income_max: { type: 'number' },
  income_min: { type: 'number' },
  standard_deduction: { type: 'number' },
  tax_rate: { type: 'number' },
} as const;

const allProperties = Object.keys(
  propertySchema,
) as unknown as (keyof typeof propertySchema)[];

export const SCHEMA: JSONSchemaType<TaxBracket[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: propertySchema,
    required: allProperties,
    additionalProperties: false,
  },
};

export const TAX_BRACKETS: TaxBracket[] = JSON.parse(
  fs.readFileSync('./data/tax_brackets.json', 'utf-8'),
);
