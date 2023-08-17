import { API_LOCATION_SCHEMA } from './location';

export const API_UTILITIES_RESPONSE_SCHEMA = {
  $id: 'APIUtilitiesResponse',
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
  },
};

export const API_UTILITIES_SCHEMA = {
  description: 'Which utilities might serve a given location?',
  querystring: {
    type: 'object',
    properties: {
      location: API_LOCATION_SCHEMA,
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
