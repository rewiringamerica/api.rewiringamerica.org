import {
  AuthorityType,
  LoanProgramStatus,
  ProjectType,
} from '@rewiringamerica/capital-common';
import { FromSchema } from 'json-schema-to-ts';
import { API_IMAGE_SCHEMA } from '../../schemas/v1/image';

/**
 * Schema for EligibleProjectType.
 */
export const ELIGIBLE_PROJECT_TYPE_SCHEMA = {
  $id: 'EligibleProjectType',
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: Object.values(ProjectType),
    },
  },
  required: ['type'],
  additionalProperties: false,
} as const;

/**
 * Schema for FinancialAuthority.
 */
export const FINANCIAL_AUTHORITY_SCHEMA = {
  $id: 'FinancialAuthority',
  type: 'object',
  properties: {
    id: { type: 'number' },
    authority_type: { type: 'string', enum: Object.values(AuthorityType) },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    state: { type: 'string' },
    city: { type: 'string', nullable: true },
    image_id: { type: 'number' },
    Image: API_IMAGE_SCHEMA,
    created_at: { type: 'string', nullable: true, format: 'date-time' },
    updated_at: { type: 'string', nullable: true, format: 'date-time' },
  },
  required: [
    'id',
    'authority_type',
    'name',
    'state',
    'city',
    'Image',
    'image_id',
  ],
  additionalProperties: false,
} as const;

/**
 * Schema for LoanProgramTerms.
 */
export const LOAN_PROGRAM_TERMS_SCHEMA = {
  $id: 'LoanProgramTerms',
  type: 'object',
  properties: {
    id: { type: 'number' },
    min_credit_score: { type: 'number', nullable: true },
    max_debt_to_income: { type: 'number', nullable: true },
    min_loan_amount: { type: 'number', nullable: true },
    max_loan_amount: { type: 'number', nullable: true },
    min_interest_rate: { type: 'number', nullable: true },
    max_interest_rate: { type: 'number', nullable: true },
    max_repayment_months: { type: 'number', nullable: true },
    created_at: { type: 'string', nullable: true, format: 'date-time' },
    updated_at: { type: 'string', nullable: true, format: 'date-time' },
  },
  required: ['id', 'created_at', 'updated_at'],
  additionalProperties: false,
} as const;

/**
 * Schema for a single LoanProgram.
 */
export const LOAN_PROGRAM_SCHEMA = {
  $id: 'LoanProgram',
  type: 'object',
  properties: {
    id: { type: 'number' },
    loan_program_key: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    description_langs: {
      type: 'object',
      nullable: true,
      patternProperties: {
        '^[a-z]{2}$': { type: 'string' },
      },
      additionalProperties: false,
    },
    status: { type: 'string', enum: Object.values(LoanProgramStatus) },
    website_url: { type: 'string', format: 'uri' },
    financial_authority_id: { type: 'number' },
    financial_authority: { $ref: 'FinancialAuthority' },
    loan_program_terms_id: { type: 'number' },
    loan_program_terms: { $ref: 'LoanProgramTerms' },
    eligible_project_types: {
      type: 'array',
      items: { $ref: 'EligibleProjectType' },
    },
    state: { type: 'string' },
    is_national: { type: 'boolean' },
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
    'loan_program_terms',
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
    '^.*$': { $ref: 'LoanProgram' },
  },
  additionalProperties: false,
} as const;

/**
 * Derived LoanProgram type.
 * The "references" array resolves the $ref for ELIGIBLE_PROJECT_TYPE_SCHEMA and FINANCIAL_AUTHORITY_SCHEMA
 */
export type LoanProgram = FromSchema<
  typeof LOAN_PROGRAM_SCHEMA,
  {
    references: [
      typeof ELIGIBLE_PROJECT_TYPE_SCHEMA,
      typeof FINANCIAL_AUTHORITY_SCHEMA,
    ];
  }
>;
