import { LoanProgramStatus } from '@rewiringamerica/capital-common';
import { FromSchema } from 'json-schema-to-ts';
import {
  ELIGIBLE_PROJECT_TYPE_SCHEMA,
  FINANCIAL_AUTHORITY_SCHEMA,
  LOAN_PROGRAM_TERMS_SCHEMA,
} from '../../data/types/capital-types';
import { STATES_AND_TERRITORIES } from '../../data/types/states';

/**
 * API response schema for loan programs.
 */
export const API_LOAN_PROGRAMS_RESPONSE_SCHEMA = {
  $id: 'APILoanProgramsResponse',
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'Unique identifier for the loan program',
      },
      loan_program_key: {
        type: 'string',
        description: 'Unique key for the loan program within a State',
      },
      name: {
        type: 'string',
        description: 'Name of the loan program',
      },
      description: {
        type: 'string',
        description: 'Detailed description of the loan program',
      },
      description_langs: {
        type: ['object', 'null'],
        description: 'Localized descriptions',
        patternProperties: {
          '^[a-z]{2}$': { type: 'string' },
        },
        additionalProperties: false,
      },
      website_url: {
        type: 'string',
        description: 'URL for loan program details',
        format: 'uri',
      },
      status: {
        type: 'string',
        description: 'Current status of the loan program',
        enum: Object.values(LoanProgramStatus),
      },
      financial_authority_id: {
        type: 'number',
        description: 'Identifier for the financial authority',
      },
      financial_authority: FINANCIAL_AUTHORITY_SCHEMA,
      eligible_project_types: {
        type: 'array',
        description: 'List of eligible project types',
        items: ELIGIBLE_PROJECT_TYPE_SCHEMA,
      },
      state: {
        type: ['string', 'null'],
        description: 'State where the loan program is offered',
        enum: [...Object.values(STATES_AND_TERRITORIES), null],
      },
      is_national: {
        type: 'boolean',
        description: 'Indicates if the loan program is national',
      },
      loan_program_terms: LOAN_PROGRAM_TERMS_SCHEMA,
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Timestamp of loan program creation',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        description: 'Timestamp of last loan program update',
      },
    },
    required: [
      'id',
      'loan_program_key',
      'name',
      'description',
      'website_url',
      'status',
      'financial_authority_id',
      'financial_authority',
      'eligible_project_types',
      'is_national',
      'created_at',
      'updated_at',
    ],
    // additionalProperties: false,
    // Conditional validations:
    // - If is_national is true, state must be null
    // - If is_national is false, state must not be null
    allOf: [
      {
        if: {
          properties: { is_national: { const: true } },
        },
        then: {
          properties: { state: { const: null } },
        },
      },
      {
        if: {
          properties: { is_national: { const: false } },
        },
        then: {
          properties: { state: { not: { const: null } } },
        },
      },
    ],
  },
} as const;

/**
 * API request schema for loan programs.
 */
export const API_LOAN_PROGRAMS_REQUEST_SCHEMA = {
  type: 'object',
  properties: {
    zip: {
      type: 'string',
      description:
        'Find loan programs available in this ZIP code. Exactly one of this or "address" is required.',
      maxLength: 5,
      minLength: 5,
    },
    address: {
      type: 'string',
      description:
        'Find loan programs available at this address. Exactly one of this or "zip" is required.',
    },
    language: {
      type: 'string',
      description: 'Optional language for user-visible strings.',
      enum: ['en', 'es'],
      default: 'en',
    },
  },
  additionalProperties: false,
  oneOf: [{ required: ['zip'] }, { required: ['address'] }],
} as const;

/**
 * API loan programs endpoint schema.
 */
export const API_LOAN_PROGRAMS_ENDPOINT_SCHEMA = {
  summary: 'BETA - Get all loan programs by location',
  description:
    "Returns the relevant loan programs for a location. The location can be specified by either a ZIP code or a full address (one of these parameters is required, providing both we result in an error). The filtering is currently just based on a user's State.",
  operationId: 'getLoanProgramsForLocation',
  querystring: API_LOAN_PROGRAMS_REQUEST_SCHEMA,
  response: {
    200: API_LOAN_PROGRAMS_RESPONSE_SCHEMA,
    400: { $ref: 'Error' },
  },
} as const;

export type APILoanProgramsRequest = FromSchema<
  typeof API_LOAN_PROGRAMS_REQUEST_SCHEMA
>;
export type APILoanProgramsResponse = FromSchema<
  typeof API_LOAN_PROGRAMS_RESPONSE_SCHEMA
>;
