import { FromSchema } from 'json-schema-to-ts';
import {
  API_AUTHORITY_SCHEMA,
  AuthorityType,
  NO_GAS_UTILITY,
} from '../../data/authorities';
import { API_COVERAGE_SCHEMA } from '../../data/types/coverage';
import { ALL_ITEMS } from '../../data/types/items';
import { API_RESPONSE_LOCATION_SCHEMA } from './location';

export const API_PROGRAMS_RESPONSE_SCHEMA = {
  $id: 'APIProgramsResponse',
  type: 'object',
  properties: {
    authorities: {
      type: 'object',
      description: `Information on the entities (government agencies, \
companies, other organizations) that offer programs in this result set.`,
      additionalProperties: API_AUTHORITY_SCHEMA,
    },
    coverage: API_COVERAGE_SCHEMA,
    location: API_RESPONSE_LOCATION_SCHEMA,
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
If absent, programs from all types of authorities will be considered.`,
            enum: Object.values(AuthorityType),
          },
          authority: {
            type: 'string',
            description: `The government agency, company, or organization that \
offers this program. This generally means the entity that the consumer will \
interact with to _claim the incentives offered by the program_, as opposed to the entity that sets the \
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
        required: ['name', 'url', 'authority_type'],
      },
    },
  },
  required: [
    'authorities',
    'coverage',
    'location',
    'programs',
  ],
} as const;

const API_PROGRAMS_REQUEST = {
  type: 'object',
  properties: {
    zip: {
      type: 'string',
      description: `Find programs that may be available in this ZIP code. \
Exactly one of this and "address" is required.`,
      maxLength: 5,
      minLength: 5,
    },
    address: {
      type: 'string',
      description: `Find programs that may be available at this address. \
Exactly one of this and "zip" is required.`,
    },
    authority_types: {
      type: 'array',
      description: `Find programs offered by these types of authorities. \
If absent, programs from all types of authorities will be considered.`,
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
    gas_utility: {
      type: 'string',
      description: `The ID of your gas utility company, as returned from \
\`/api/v1/utilities\`, or the special string \`${NO_GAS_UTILITY}\` indicating \
that you do not have gas service. A value other than \`${NO_GAS_UTILITY}\` is \
required if authority_types includes "gas_utility". If this parameter is \
absent or \`${NO_GAS_UTILITY}\`, no programs offered by gas utilities will \
be returned. In some jurisdictions, your gas utility can affect your \
eligibility for programs offered by other authorities; in such cases, if \
this parameter is absent, programs with gas-utility-dependent eligibility \
will _not_ be returned.`,
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
  oneOf: [
    { required: ['zip'] },
    { required: ['address'] },
  ],
} as const;

export const API_PROGRAMS_REQUEST_SCHEMA = {
  summary: 'Get all programs by location',
  description:
    'Returns all incentive programs by location and optionally, utility',
  operationId: 'getProgramsForLocation',
  querystring: API_PROGRAMS_REQUEST,
  response: {
    200: {
      ...API_PROGRAMS_RESPONSE_SCHEMA,
    },
    400: {
      $ref: 'Error',
    },
  },
} as const;

export type APIProgramsRequest = FromSchema<typeof API_PROGRAMS_REQUEST>;
export type APIProgramsResponse = FromSchema<
  typeof API_PROGRAMS_RESPONSE_SCHEMA
>;
