import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';
import { STATES_AND_TERRITORIES } from './types/states';

const GEO_GROUP_SCHEMA = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    utilities: { type: 'array', items: { type: 'string' }, minItems: 1 },
    cities: { type: 'array', items: { type: 'string' }, minItems: 1 },
    counties: { type: 'array', items: { type: 'string' }, minItems: 1 },
    incentives: { type: 'array', items: { type: 'string' }, minItems: 1 },
  },
  additionalProperties: false,
  anyOf: [
    { required: ['utilities'] },
    { required: ['cities'] },
    { required: ['counties'] },
  ],
  required: ['incentives'],
} as const;

export type GeoGroup = FromSchema<typeof GEO_GROUP_SCHEMA>;

export const GEO_GROUPS_SCHEMA = {
  type: 'object',
  propertyNames: {
    type: 'string',
    enum: STATES_AND_TERRITORIES,
  },
  additionalProperties: {
    type: 'object',
    additionalProperties: GEO_GROUP_SCHEMA,
    required: [],
  },
  required: [],
} as const;

export type GeoGroupsByState = FromSchema<typeof GEO_GROUPS_SCHEMA>;

export const GEO_GROUPS_BY_STATE: GeoGroupsByState = JSON.parse(
  fs.readFileSync('./data/geo_groups.json', 'utf-8'),
);
