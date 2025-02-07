import { FromSchema } from 'json-schema-to-ts';
import { LoanProgramStatus, ProjectType } from '../../data/types/capital-types';
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
          name: {
            type: 'string',
            description: 'Name of the loan program',
          },
          website_url: {
            type: 'string',
            description: 'URL for loan program details',
          },
          status: {
            type: 'string',
            description: 'Current status of the loan program',
            enum: Object.values(LoanProgramStatus),
          },
          financial_authority: {
            type: 'string',
            description:
              'Identifier for the financial authority offering this loan program',
          },
          eligible_project_types: {
            type: 'array',
            description: 'List of eligible project types',
            items: {
              type: 'string',
              enum: Object.values(ProjectType),
            },
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
        },
        required: [
          'name',
          'website_url',
          'financial_authority',
          'eligible_project_types',
          'is_national',
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
