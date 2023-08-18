import { JSONSchemaType } from 'ajv';
import fs from 'fs';
import { STATES_PLUS_DC } from './states';

const propertySchema = {
  METRO: { type: 'number' },
  NONMETRO: { type: 'number' },
  TOTAL: { type: 'number' },
} as const;

const allProperties = Object.keys(
  propertySchema,
) as unknown as (keyof typeof propertySchema)[];

export type StateMFI = {
  METRO: number;
  NONMETRO: number;
  TOTAL: number;
};

export const SCHEMA: JSONSchemaType<{ [stateId: string]: StateMFI }> = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: propertySchema,
    required: allProperties,
  },
  required: STATES_PLUS_DC,
};

export const STATE_MFIS: { [stateId: string]: StateMFI } = JSON.parse(
  fs.readFileSync('./data/state_mfi.json', 'utf-8'),
);
