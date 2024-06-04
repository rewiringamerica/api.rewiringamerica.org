import { API_RESPONSE_LOCATION_SCHEMA } from './location';

export const API_UTILITIES_RESPONSE_SCHEMA = {
  $id: 'APIUtilitiesResponse',
  type: 'object',
  properties: {
    location: API_RESPONSE_LOCATION_SCHEMA,
    utilities: {
      type: 'object',
      description: 'A map of utility IDs to info about each utility.',
      additionalProperties: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: `The customer-facing brand name of the utility. This \
may differ from the name of the utility's legal entity.`,
          },
        },
      },
    },
  },
  required: ['location', 'utilities'],
  additionalProperties: false,
};

export const API_UTILITIES_SCHEMA = {
  summary: 'Find utilities by location',
  description: `Returns the electric utilities that may serve the given \
location. Because the location is imprecise, and because utility service \
territories aren't precisely defined, there may be multiple results, including \
utilities that don't actually serve the given location.`,
  operationId: 'getUtilities',
  querystring: {
    type: 'object',
    properties: {
      zip: {
        type: 'string',
        description: `Find utilities that may serve this ZIP code. Exactly one \
of this or "address" is required.`,
        maxLength: 5,
        minLength: 5,
      },
      address: {
        type: 'string',
        description: `Find utilities that may serve this address. Exactly one \
of this or "zip" is required.`,
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
    oneOf: [
      { required: ['zip'] },
      { required: ['address'] },
    ],
    additionalProperties: false,
  },
  response: {
    200: {
      ...API_UTILITIES_RESPONSE_SCHEMA,
    },
    400: {
      $ref: 'Error',
    },
  },
} as const;
