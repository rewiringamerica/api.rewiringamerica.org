import { LoanProgramStatus } from '@rewiringamerica/capital-common';
import { FromSchema } from 'json-schema-to-ts';
import {
  ELIGIBLE_PROJECT_TYPE_SCHEMA,
  FINANCIAL_AUTHORITY_SCHEMA,
} from '../../data/types/capital-types';
import { STATES_AND_TERRITORIES } from '../../data/types/states';

const STATES = [...STATES_AND_TERRITORIES, 'NT'];

/**
 * API response schema for loan programs.
 */
export const API_LOAN_PROGRAMS_RESPONSE_SCHEMA = {
  $id: 'APILoanProgramsResponse',
  type: 'object',
  properties: {
    loan_programs: {
      type: 'object',
      description: 'A map of IDs to loan program data.',
      additionalProperties: {
        type: 'object',
        properties: {
          loan_program_key: {
            type: 'string',
            description: 'Unique key for the loan program within a State',
          },
          name: {
            type: 'string',
            description: 'Name of the loan program',
          },
          description: { type: 'string' },
          description_langs: {
            type: ['object', 'null'],
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
          financial_authority: FINANCIAL_AUTHORITY_SCHEMA,
          eligible_project_types: {
            type: 'array',
            description: 'List of eligible project types',
            items: ELIGIBLE_PROJECT_TYPE_SCHEMA,
          },
          state: {
            type: 'string',
            description: 'State where the loan program is offered',
            enum: Object.values(STATES),
          },
          is_national: {
            type: 'boolean',
            description: 'Indicates if the loan program is national',
          },
          metadata: { type: 'object' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
        required: [
          'loan_program_key',
          'name',
          'description',
          'website_url',
          'status',
          'financial_authority',
          'eligible_project_types',
          'is_national',
          'metadata',
          'created_at',
          'updated_at',
        ],
        // Conditional validations:
        // - If is_national is true, state must equal "NT"
        // - If is_national is false, state must not equal "NT"
        allOf: [
          {
            if: {
              properties: { is_national: { const: true } },
            },
            then: {
              properties: { state: { const: 'NT' } },
            },
          },
          {
            if: {
              properties: { is_national: { const: false } },
            },
            then: {
              properties: { state: { not: { const: 'NT' } } },
            },
          },
        ],
      },
    },
  },
  required: ['loan_programs'],
} as const;

/**
 * API request schema for loan programs.
 */
const API_LOAN_PROGRAMS_REQUEST = {
  type: 'object',
  properties: {
    zip: {
      type: 'string',
      description:
        'Find loan programs available in this ZIP code. Exactly one of this and "address" is required.',
      maxLength: 5,
      minLength: 5,
    },
    address: {
      type: 'string',
      description:
        'Find loan programs available at this address. Exactly one of this and "zip" is required.',
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
export const API_LOAN_PROGRAMS_REQUEST_SCHEMA = {
  summary: 'Get all loan programs by location',
  description: 'Returns all loan programs for a specified location.',
  operationId: 'getLoanProgramsForLocation',
  querystring: API_LOAN_PROGRAMS_REQUEST,
  response: {
    200: API_LOAN_PROGRAMS_RESPONSE_SCHEMA,
    400: { $ref: 'Error' },
  },
} as const;

export type APILoanProgramsRequest = FromSchema<
  typeof API_LOAN_PROGRAMS_REQUEST
>;
export type APILoanProgramsResponse = FromSchema<
  typeof API_LOAN_PROGRAMS_RESPONSE_SCHEMA
>;
