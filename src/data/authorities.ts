import fs from 'fs';
import { JSONSchemaType } from 'ajv';
import { STATES_PLUS_DC } from './states.js';

/**
 * An authority is a government agency, utility, or other organization that
 * offers incentives.
 */
export type Authority = {
  name: string;
};

export type StateAuthorities = {
  state: { [authId: string]: Authority };
  utility: { [authId: string]: Authority };
};

const authoritySchema = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    required: ['name'],
  },
  required: [],
} as const;

export const SCHEMA: JSONSchemaType<{ [stateId: string]: StateAuthorities }> = {
  type: 'object',
  propertyNames: {
    type: 'string',
    enum: STATES_PLUS_DC,
  },
  additionalProperties: {
    type: 'object',
    properties: {
      state: authoritySchema,
      utility: authoritySchema,
    },
    required: ['state', 'utility'],
  },
  required: [],
};

export const AUTHORITIES_BY_STATE: { [stateId: string]: StateAuthorities } =
  JSON.parse(fs.readFileSync('./data/authorities.json', 'utf-8'));
