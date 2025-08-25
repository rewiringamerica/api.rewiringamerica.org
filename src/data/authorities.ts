import fs from 'fs';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { API_IMAGE_SCHEMA } from '../schemas/v1/image';
import { STATES_AND_TERRITORIES } from './types/states';

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
  City = 'city',
  County = 'county',
  State = 'state',
  Utility = 'utility',
  GasUtility = 'gas_utility',
  Other = 'other',
}

const AUTHORITY_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    logo: API_IMAGE_SCHEMA,
    geography_ids: { type: 'array', items: { type: 'integer' }, minItems: 1 },
  },
  required: ['name', 'geography_ids'],
  additionalProperties: false,
} as const satisfies JSONSchema;

/**
 * The same as AUTHORITY_SCHEMA, but with only the name and logo fields; this is
 * what is exposed via the API.
 */
export const API_AUTHORITY_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    logo: API_IMAGE_SCHEMA,
  },
  required: ['name'],
  additionalProperties: false,
} as const;

export type APIAuthority = FromSchema<typeof API_AUTHORITY_SCHEMA>;

const authoritiesMapSchema = {
  type: 'object',
  additionalProperties: AUTHORITY_SCHEMA,
  required: [],
} as const;

export type AuthoritiesById = FromSchema<typeof authoritiesMapSchema>;

export const SCHEMA = {
  type: 'object',
  propertyNames: {
    type: 'string',
    enum: STATES_AND_TERRITORIES,
  },
  additionalProperties: {
    type: 'object',
    properties: {
      state: authoritiesMapSchema,
      utility: authoritiesMapSchema,
      city: authoritiesMapSchema,
      county: authoritiesMapSchema,
      gas_utility: authoritiesMapSchema,
      other: authoritiesMapSchema,
    },
    required: ['utility'],
    additionalProperties: false,
  },
  required: [],
} as const;

export type AuthoritiesByType = { [index: string]: AuthoritiesById };
export type AuthoritiesByState = FromSchema<typeof SCHEMA>;

export const AUTHORITIES_BY_STATE: AuthoritiesByState = (() => {
  const result: AuthoritiesByState = {};
  for (const state of STATES_AND_TERRITORIES) {
    const filepath = `./data/${state}/authorities.json`;
    if (fs.existsSync(filepath)) {
      result[state] = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    }
  }
  return result;
})();

/**
 * A special value for the API to allow positively indicating "I don't have gas
 * service" (as opposed to your gas utility being unknown or unspecified). This
 * matters for some eligibility decisions, such as with MA's Mass Save program.
 */
export const NO_GAS_UTILITY = 'none';
