import { JSONSchemaType } from 'ajv';
import fs from 'fs';
import { STATES_PLUS_DC } from './states';

const propertySchema = {
  estimate_savings_space_heat: { type: 'number' },
  estimated_savings_electrify_solar: { type: 'number' },
  estimated_savings_ev: { type: 'number' },
  estimated_savings_heat_pump_ev: { type: 'number' },
  estimated_savings_solar_ev: { type: 'number' },
  estimated_savings_space_heat_ev: { type: 'number' },
  estimated_savings_water_heater: { type: 'number' },
  estimated_savings_water_heater_solar: { type: 'number' },
} as const;

const allProperties = Object.keys(
  propertySchema,
) as unknown as (keyof typeof propertySchema)[];

export type IRAStateSavings = {
  [k in keyof typeof propertySchema]: number;
};

export const SCHEMA: JSONSchemaType<{ [stateId: string]: IRAStateSavings }> = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: propertySchema,
    required: allProperties,
  },
  required: STATES_PLUS_DC,
};

const FILEPATH = './data/ira_state_savings.json';
export const IRA_STATE_SAVINGS: { [stateId: string]: IRAStateSavings } =
  JSON.parse(fs.readFileSync(FILEPATH, 'utf-8'));
