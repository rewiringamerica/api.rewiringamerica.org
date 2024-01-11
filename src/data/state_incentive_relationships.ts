import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';

const prerequisiteSchema = {
  type: 'array',
  items: { type: 'string' },
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

export type IncentiveRelationships = FromSchema<
  typeof INCENTIVE_RELATIONSHIPS_SCHEMA
>;

export type IncentiveRelationshipsMap = {
  [stateId: string]: IncentiveRelationships;
};

export const CT_RELATIONSHIPS: IncentiveRelationships = JSON.parse(
  fs.readFileSync('./data/CT/incentive_relationships.json', 'utf-8'),
);

export const VT_RELATIONSHIPS: IncentiveRelationships = JSON.parse(
  fs.readFileSync('./data/VT/incentive_relationships.json', 'utf-8'),
);

export const INCENTIVE_RELATIONSHIPS_BY_STATE: IncentiveRelationshipsMap = {
  CT: CT_RELATIONSHIPS,
  NY: {},
  RI: {},
  VT: VT_RELATIONSHIPS,
};
