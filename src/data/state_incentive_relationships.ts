import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';
import { STATES_AND_TERRITORIES } from './types/states';

export const anyOrAllSchema = {
  type: 'array',
  items: { $ref: 'IncentivePrerequisites' },
} as const;

export const prerequisiteSchema = {
  $id: 'IncentivePrerequisites',
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
  additionalProperties: false,
} as const;

export type IncentivePrerequisites = FromSchema<typeof prerequisiteSchema>;

export type IncentiveRelationships = FromSchema<
  typeof INCENTIVE_RELATIONSHIPS_SCHEMA
>;

export type IncentiveRelationshipsMap = {
  [stateId: string]: IncentiveRelationships;
};

export const INCENTIVE_RELATIONSHIPS_BY_STATE: IncentiveRelationshipsMap =
  (() => {
    const result: IncentiveRelationshipsMap = {};
    for (const state of STATES_AND_TERRITORIES) {
      const filepath = `./data/${state}/incentive_relationships.json`;
      if (fs.existsSync(filepath)) {
        result[state] = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      }
    }
    return result;
  })();
