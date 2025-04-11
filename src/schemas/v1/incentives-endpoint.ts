import { FromSchema } from 'json-schema-to-ts';
import { AmountType } from '../../data/types/amount';
import { PaymentMethod } from '../../data/types/incentive-types';
import { ALL_ITEMS } from '../../data/types/items';
import { OwnerStatus } from '../../data/types/owner-status';
import { STATES_AND_TERRITORIES } from '../../data/types/states';

export const API_INCENTIVES_REQUEST_SCHEMA = {
  title: 'APIIncentivesRequest',
  type: 'object',
  properties: {
    state: {
      type: 'string',
      description:
        'Find incentives available in this state. If not provided, returns incentives from all states.',
      enum: STATES_AND_TERRITORIES,
    },
    language: {
      type: 'string',
      description: 'Optional choice of language for user-visible strings.',
      enum: [
        'en',
        'es',
      ],
      default: 'en',
    },
  },
  additionalProperties: false,
} as const;

export const API_INCENTIVES_RESPONSE_SCHEMA = {
  $id: 'APIIncentivesResponse',
  type: 'object',
  required: ['incentives', 'metadata'],
  properties: {
    incentives: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'id',
          'items',
          'short_description',
          'payment_methods',
          'amount',
          'owner_status',
          'program',
        ],
        properties: {
          id: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'string',
              enum: ALL_ITEMS,
            },
          },
          short_description: {
            type: 'object',
            required: ['en'],
            properties: {
              en: { type: 'string' },
              es: { type: 'string' },
            },
            additionalProperties: false,
          },
          start_date: { type: 'string' },
          end_date: { type: 'string' },
          payment_methods: {
            type: 'array',
            items: {
              type: 'string',
              enum: Object.values(PaymentMethod),
            },
          },
          amount: {
            type: 'object',
            required: ['type', 'number'],
            properties: {
              type: {
                type: 'string',
                enum: Object.values(AmountType),
              },
              number: { type: 'number' },
              maximum: { type: 'number' },
              minimum: { type: 'number' },
              unit: { type: 'string' },
            },
            additionalProperties: false,
          },
          owner_status: {
            type: 'array',
            items: {
              type: 'string',
              enum: Object.values(OwnerStatus),
            },
          },
          income_qualified: {
            type: 'boolean',
            description:
              'Indicates whether this incentive has income eligibility requirements',
          },
          program: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
    metadata: {
      type: 'object',
      required: ['total_incentives', 'total_states'],
      properties: {
        total_incentives: { type: 'number' },
        total_states: { type: 'number' },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export const API_INCENTIVES_SCHEMA = {
  summary: 'Get incentives',
  description: 'Returns incentives, optionally filtered by state',
  operationId: 'getIncentives',
  querystring: API_INCENTIVES_REQUEST_SCHEMA,
  response: {
    200: {
      ...API_INCENTIVES_RESPONSE_SCHEMA,
    },
    400: {
      $ref: 'Error',
    },
  },
} as const;

export type APIIncentivesRequest = FromSchema<
  typeof API_INCENTIVES_REQUEST_SCHEMA
>;
export type APIIncentivesResponse = FromSchema<
  typeof API_INCENTIVES_RESPONSE_SCHEMA
>;
