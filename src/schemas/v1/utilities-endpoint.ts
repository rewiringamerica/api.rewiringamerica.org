import {
  API_REQUEST_LOCATION_SCHEMA,
  API_RESPONSE_LOCATION_SCHEMA,
} from './location';

export const API_UTILITIES_RESPONSE_SCHEMA = {
  $id: 'APIUtilitiesResponse',
  type: 'object',
  properties: {
    location: API_RESPONSE_LOCATION_SCHEMA,
    utilities: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    },
  },
  required: ['location', 'utilities'],
  additionalProperties: false,
};

export const API_UTILITIES_SCHEMA = {
  description: 'Which utilities might serve a given location?',
  querystring: {
    type: 'object',
    properties: {
      location: API_REQUEST_LOCATION_SCHEMA,
      language: {
        type: 'string',
        description: 'Optional choice of language for user-visible strings.',
        enum: [
          'en',
          'es',
        ],
        default: 'en',
      },
      include_beta_states: {
        type: 'boolean',
        description:
          'Option to include states which are in development and not fully launched.',
        default: 'false',
      },
    },
    required: ['location'],
  },
  response: {
    200: {
      description: 'Successful response',
      ...API_UTILITIES_RESPONSE_SCHEMA,
    },
    400: {
      description: 'Bad request',
      $ref: 'Error',
    },
  },
} as const;
