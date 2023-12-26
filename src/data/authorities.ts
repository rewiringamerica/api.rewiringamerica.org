import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';
import { API_IMAGE_SCHEMA } from '../schemas/v1/image';
import { STATES_PLUS_DC } from './types/states';

/**
 * An authority is a government agency, utility, or other organization that
 * offers incentives.
 *
 * The operative distinction here is not the nature of the legal entity, but
 * rather the **geographic coverage** of the incentives the authority offers:
 *
 * - Federal incentives can be available countrywide.
 * - State incentives can be available to any resident of a specific state.
 * - Utility incentives can be available to any customer of a specific utility.
 *   In our data, utilities are scoped to states. If a single utility company
 *   operates across multiple states, we'll represent that as multiple utility
 *   IDs, one in each state.
 */
export enum AuthorityType {
  Federal = 'federal',
  Local = 'local',
  State = 'state',
  Utility = 'utility',
}

export const API_AUTHORITY_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    logo: API_IMAGE_SCHEMA,
  },
  required: ['name'],
  additionalProperties: false,
} as const;

export type Authority = FromSchema<typeof API_AUTHORITY_SCHEMA>;

const authoritiesMapSchema = {
  type: 'object',
  additionalProperties: API_AUTHORITY_SCHEMA,
  required: [],
} as const;

export type AuthoritiesById = FromSchema<typeof authoritiesMapSchema>;

export const SCHEMA = {
  type: 'object',
  propertyNames: {
    type: 'string',
    enum: STATES_PLUS_DC,
  },
  additionalProperties: {
    type: 'object',
    properties: {
      state: authoritiesMapSchema,
      utility: authoritiesMapSchema,
      local: authoritiesMapSchema,
    },
    required: ['state', 'utility'],
    additionalProperties: false,
  },
  required: [],
} as const;

export type AuthoritiesByState = FromSchema<typeof SCHEMA>;

export const AUTHORITIES_BY_STATE: AuthoritiesByState = JSON.parse(
  fs.readFileSync('./data/authorities.json', 'utf-8'),
);
