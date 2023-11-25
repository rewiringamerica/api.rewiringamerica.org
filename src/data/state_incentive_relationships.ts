import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';

export const INCENTIVE_RELATIONSHIPS_SCHEMA = {
  type: 'object',
  properties: {
    // Prerequisite relationships are represented by a mapping of incentive ID
    // to an array of IDs of incentives that this incentive requires.
    prerequisites: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          requires: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'requires'],
      },
    },
    // Exclusion relationships are represented by a mapping of incentive ID
    // to an array of IDs that are superseded by this incentive.
    exclusions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          supersedes: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'supersedes'],
      },
    },
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

export const INCENTIVE_RELATIONSHIPS_BY_STATE: IncentiveRelationshipsMap = {
  CT: CT_RELATIONSHIPS,
  NY: {},
  RI: {},
};
