import { ERROR_SCHEMA } from '../error.js';
import { API_INCENTIVE_SCHEMA } from './incentive.js';

export const API_INCENTIVES_SCHEMA = {
  description: 'What are all the incentives from the Inflation Reduction Act?',
  querystring: {
    type: 'object',
    properties: {
      language: {
        type: 'string',
        description:
          'Optional choice of language for `item`, `program` and `item_url` properties.',
        enum: ['en', 'es'],
        default: 'en',
      },
    },
  },
  response: {
    200: {
      description: 'Successful response',
      type: 'object',
      required: ['incentives'],
      properties: {
        incentives: {
          type: 'array',
          items: API_INCENTIVE_SCHEMA,
        },
      },
    },
    400: {
      description: 'Bad request',
      ...ERROR_SCHEMA,
    },
  },
} as const;
