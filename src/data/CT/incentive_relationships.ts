import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';

export const SCHEMA = {
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
        },
      },
    },
  },
} as const;

export type CtIncentiveRelationships = FromSchema<typeof SCHEMA>;

export const CT_INCENTIVE_RELATIONSHIPS: CtIncentiveRelationships = JSON.parse(
  fs.readFileSync('./data/CT/incentive_relationships.json', 'utf-8'),
);
