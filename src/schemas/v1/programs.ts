import { API_AUTHORITY_SCHEMA, AuthorityType } from '../../data/authorities';
import { API_COVERAGE_SCHEMA } from '../../data/types/coverage';
import { ALL_ITEMS } from '../../data/types/items';
import { API_RESPONSE_LOCATION_SCHEMA } from './location';

export const API_PROGRAMS_RESPONSE_SCHEMA = {
  authorities: {
    type: 'object',
    description: `Information on the entities (government agencies, \
companies, other organizations) that offer incentives in this result set.`,
    additionalProperties: API_AUTHORITY_SCHEMA,
  },
  coverage: API_COVERAGE_SCHEMA,
  location: API_RESPONSE_LOCATION_SCHEMA,
  type: 'object',
  properties: {
    programs: {
      type: 'object',
      description: 'A map of IDs to incentive program data.',
      additionalProperties: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the program',
          },
          url: {
            type: 'string',
            description: 'URL to program information',
          },
          authority_type: {
            type: 'string',
            description: `Find programs offered by these types of authorities. \
If absent, incentives from all types of authorities will be considered.`,
            enum: Object.values(AuthorityType),
          },
          authority: {
            type: 'string',
            description: `The government agency, company, or organization that \
offers this incentive. This generally means the entity that the consumer will \
interact with to _claim the incentive_, as opposed to the entity that sets the \
program rules, or that provides funding.`,
          },
          items: {
            type: 'array',
            items: {
              type: 'string',
              enum: ALL_ITEMS,
            },
            description: `What products or services the program can be used on. \
**NOTE**: we expect to add possible values to this field over time. Client \
code should gracefully handle unknown values it sees here.`,
          },
        },
      },
    },
  },
} as const;

export const API_PROGRAMS_REQUEST_SCHEMA = {
  summary: 'Get all programs by location',
  description:
    'Returns all incentive programs by location and optionally, utility',
  operationId: 'getProgramsForLocation',
  querystring: {
    type: 'object',
    properties: {
      zip: {
        type: 'string',
        description: `Find incentives that may be available in this ZIP code. \
Exactly one of this and "address" is required.`,
        maxLength: 5,
        minLength: 5,
      },
      address: {
        type: 'string',
        description: `Find incentives that may be available at this address. \
Exactly one of this and "zip" is required.`,
      },
      authority_types: {
        type: 'array',
        description: `Find incentives offered by these types of authorities. \
If absent, incentives from all types of authorities will be considered.`,
        items: {
          type: 'string',
          enum: Object.values(AuthorityType),
        },
        minItems: 1,
        uniqueItems: true,
      },
      utility: {
        type: 'string',
        description: `The ID of your electric utility company, as returned from \
\`/api/v1/utilities\`. Required if authority_types includes "utility". If \
absent, no programs offered by electric utilities will be returned.`,
      },
    },
    additionalProperties: false,
    oneOf: [
      { required: ['zip'] },
      { required: ['address'] },
    ],
  },
  response: {
    200: {
      ...API_PROGRAMS_RESPONSE_SCHEMA,
    },
    400: {
      $ref: 'Error',
    },
  },
} as const;
