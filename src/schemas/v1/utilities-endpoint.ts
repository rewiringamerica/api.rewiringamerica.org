import { API_RESPONSE_LOCATION_SCHEMA } from './location';

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
      zip: {
        type: 'string',
        description:
          'Your zip code helps us estimate the amount of discounts and tax credits you qualify for by finding representative census tracts in your area.',
        maxLength: 5,
        minLength: 5,
      },
      address: {
        type: 'string',
        description:
          "Your address can determine the precise census tract you're in that determines the correct amount of discounts and tax credits you qualify for.",
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
      include_beta_states: {
        type: 'boolean',
        description:
          'Option to include states which are in development and not fully launched.',
        default: 'false',
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
