import fs from 'fs';
import { JSONSchemaType } from 'ajv';
import { STATES_PLUS_DC } from './states.js';

const propertySchema = {
  cost_per_watt: { type: 'number' },
  system_cost: { type: 'number' },
  tax_credit: { type: 'number' },
} as const;

const allProperties = Object.keys(
  propertySchema,
) as unknown as (keyof typeof propertySchema)[];

export type SolarPrices = {
  cost_per_watt: number;
  system_cost: number;
  tax_credit: number;
};

export const SCHEMA: JSONSchemaType<{ [stateId: string]: SolarPrices }> = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: propertySchema,
    required: allProperties,
  },
  required: STATES_PLUS_DC,
};

export const SOLAR_PRICES: { [stateId: string]: SolarPrices } = JSON.parse(
  fs.readFileSync('./data/solar_prices.json', 'utf-8'),
);