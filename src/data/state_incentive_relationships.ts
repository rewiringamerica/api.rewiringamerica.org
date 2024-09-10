import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';
import { STATES_AND_TERRITORIES } from './types/states';

export const prerequisiteSchema = {
  oneOf: [
    { type: 'string' },
    {
      type: 'object',
      properties: {
        anyOf: {
          type: 'array',
          items: { type: 'string' },
        },
        description: { type: 'string' },
      },
      required: ['anyOf'],
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: {
        allOf: {
          type: 'array',
          items: { type: 'string' },
        },
        description: { type: 'string' },
      },
      required: ['allOf'],
      additionalProperties: false,
    },
  ],
} as const;

const exclusionSchema = {
  oneOf: [
    {
      type: 'array',
      items: { type: 'string' },
    },
    {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
        },
        description: {
          type: 'string',
        },
      },
      additionalProperties: false,
      required: ['ids'],
    },
  ],
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
          description: { type: 'string' },
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
