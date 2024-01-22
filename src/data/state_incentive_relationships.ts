import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';

export const anyOrAllSchema = {
  type: 'array',
  items: { $ref: 'prerequisiteSchema' },
} as const;

export const prerequisiteSchema = {
  oneOf: [
    { type: 'string' },
    {
      type: 'object',
      properties: { anyOf: anyOrAllSchema },
      required: ['anyOf'],
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: { allOf: anyOrAllSchema },
      required: ['allOf'],
      additionalProperties: false,
    },
  ],
} as const;

const exclusionSchema = {
  type: 'array',
  items: { type: 'string' },
} as const;

export const INCENTIVE_RELATIONSHIPS_SCHEMA = {
  type: 'object',
  properties: {
    // Prerequisite relationships are represented by a mapping of incentive ID
    // to an array of IDs of incentives that this incentive requires.
    prerequisites: { type: 'object', additionalProperties: prerequisiteSchema },
    // Exclusion relationships are represented by a mapping of incentive ID
    // to an array of IDs that are superseded by this incentive.
    exclusions: { type: 'object', additionalProperties: exclusionSchema },
    // Combination relationships are represented by an array of incentive IDs
    // and the max value of the savings offered by that group of incentives.
    combinations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          max_value: { type: 'number' },
        },
        required: ['ids', 'max_value'],
      },
    },
  },
} as const;

export type IncentivePrerequisites = FromSchema<typeof prerequisiteSchema>;

export type IncentiveRelationships = FromSchema<
  typeof INCENTIVE_RELATIONSHIPS_SCHEMA
>;

export type IncentiveRelationshipsMap = {
  [stateId: string]: IncentiveRelationships;
};

export const CO_RELATIONSHIPS: IncentiveRelationships = JSON.parse(
  fs.readFileSync('./data/CO/incentive_relationships.json', 'utf-8'),
);

export const CT_RELATIONSHIPS: IncentiveRelationships = JSON.parse(
  fs.readFileSync('./data/CT/incentive_relationships.json', 'utf-8'),
);

export const VT_RELATIONSHIPS: IncentiveRelationships = JSON.parse(
  fs.readFileSync('./data/VT/incentive_relationships.json', 'utf-8'),
);

export const INCENTIVE_RELATIONSHIPS_BY_STATE: IncentiveRelationshipsMap = {
  CO: CO_RELATIONSHIPS,
  CT: CT_RELATIONSHIPS,
  NY: {},
  RI: {},
  VT: VT_RELATIONSHIPS,
};
