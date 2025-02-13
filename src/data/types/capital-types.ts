import {
  AuthorityType,
  LoanProgramStatus,
  ProjectType,
} from '@rewiringamerica/capital-common';
import { FromSchema } from 'json-schema-to-ts';

/**
 * Schema for Image.
 */
export const IMAGE_SCHEMA = {
  $id: 'Image.schema.json',
  type: 'object',
  properties: {
    src: { type: 'string' },
  },
  required: ['src'],
  additionalProperties: false,
} as const;

/**
 * Schema for EligibleProjectType.
 */
export const ELIGIBLE_PROJECT_TYPE_SCHEMA = {
  $id: 'EligibleProjectType.schema.json',
  type: 'object',
  properties: {
    type: { type: 'string', enum: Object.values(ProjectType) },
  },
  required: ['type'],
  additionalProperties: false,
} as const;

/**
 * Schema for FinancialAuthority.
 */
export const FINANCIAL_AUTHORITY_SCHEMA = {
  $id: 'FinancialAuthority.schema.json',
  type: 'object',
  properties: {
    id: { type: 'number' },
    authority_type: { type: 'string', enum: Object.values(AuthorityType) },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
    state: { type: 'string' },
    city: { type: ['string', 'null'] },
    Image: { $ref: 'Image.schema.json' },
    created_at: { type: ['string', 'null'], format: 'date-time' },
    updated_at: { type: ['string', 'null'], format: 'date-time' },
  },
  required: ['id', 'authority_type', 'name', 'state', 'city', 'Image'],
  additionalProperties: false,
} as const;

/**
 * Schema for a single LoanProgram.
 */
export const LOAN_PROGRAM_SCHEMA = {
  $id: 'LoanProgram.schema.json',
  type: 'object',
  properties: {
    id: { type: 'number' },
    loan_program_key: { type: ['string', 'null'] }, // TODO: remove the null option when this field is required
    name: { type: 'string' },
    description: { type: 'string' },
    description_langs: {
      type: ['object', 'null'],
      patternProperties: {
        '^[a-z]{2}$': { type: 'string' },
      },
      additionalProperties: false,
    },
    status: { type: 'string', enum: Object.values(LoanProgramStatus) },
    website_url: { type: 'string', format: 'uri' },
    financial_authority_id: { type: 'number' },
    financial_authority: { $ref: 'FinancialAuthority.schema.json' },
    eligible_project_types: {
      type: 'array',
      items: { $ref: 'EligibleProjectType.schema.json' },
    },
    state: { type: 'string' },
    is_national: { type: 'boolean' },
    metadata: { type: 'object' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
  required: [
    'id',
    'name',
    'description',
    'website_url',
    'financial_authority',
    'eligible_project_types',
    'state',
    'is_national',
    'metadata',
    'created_at',
    'updated_at',
  ],
  additionalProperties: false,
} as const;

/**
 * Schema for a collection of LoanPrograms.
 */
export const LOAN_PROGRAMS_SCHEMA = {
  $id: 'LoanPrograms',
  title: 'LoanPrograms',
  type: 'object',
  patternProperties: {
    '^.*$': { $ref: 'LoanProgram.schema.json' },
  },
  additionalProperties: false,
} as const;

/**
 * Derived LoanProgram type.
 * The "references" array resolves the $ref for ELIGIBLE_PROJECT_TYPE_SCHEMA, FINANCIAL_AUTHORITY_SCHEMA, and IMAGE_SCHEMA.
 */
export type LoanProgram = FromSchema<
  typeof LOAN_PROGRAM_SCHEMA,
  {
    references: [
      typeof ELIGIBLE_PROJECT_TYPE_SCHEMA,
      typeof FINANCIAL_AUTHORITY_SCHEMA,
      typeof IMAGE_SCHEMA,
    ];
  }
>;
