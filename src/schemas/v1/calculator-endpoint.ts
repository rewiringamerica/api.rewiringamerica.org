import { FromSchema } from 'json-schema-to-ts';
import { API_AUTHORITY_SCHEMA, AuthorityType } from '../../data/authorities';
import { API_DATA_PARTNER_SCHEMA } from '../../data/data_partners';
import { FilingStatus } from '../../data/tax_brackets';
import { API_COVERAGE_SCHEMA } from '../../data/types/coverage';
import { ALL_ITEMS } from '../../data/types/items';
import { OwnerStatus } from '../../data/types/owner-status';
import { API_INCENTIVE_SCHEMA } from './incentive';
import {
  API_REQUEST_LOCATION_SCHEMA,
  API_RESPONSE_LOCATION_SCHEMA,
} from './location';

const API_CALCULATOR_REQUEST_SCHEMA = {
  title: 'APICalculatorRequest',
  type: 'object',
  properties: {
    // TODO: remove location param once frontend is not using it
    location: API_REQUEST_LOCATION_SCHEMA,
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
    authority_types: {
      type: 'array',
      description:
        'Which types of authority to fetch incentives for: "federal", "state", or "utility".',
      items: {
        type: 'string',
        enum: Object.values(AuthorityType),
      },
      minItems: 1,
      uniqueItems: true,
    },
    utility: {
      type: 'string',
      description:
        'The ID of your utility company, as returned from /utilities. ' +
        'Required if authority_types includes "utility".',
    },
    items: {
      type: 'array',
      description:
        'Which types of product or project to fetch incentives for. If absent, include all products/projects.',
      items: {
        type: 'string',
        enum: ALL_ITEMS,
      },
      minItems: 1,
      uniqueItems: true,
    },
    owner_status: {
      type: 'string',
      description: 'Homeowners and renters qualify for different incentives.',
      enum: Object.values(OwnerStatus),
    },
    household_income: {
      type: 'integer',
      description:
        'Enter your gross income (income before taxes). Include wages and salary plus other forms of income, including pensions, interest, dividends, and rental income. If you are married and file jointly, include your spouse’s income.',
      minimum: 0,
      maximum: 100000000,
      examples: [
        80000,
      ],
    },
    tax_filing: {
      type: 'string',
      description:
        'Select "Head of Household" if you have a child or relative living with you, and you pay more than half the costs of your home. Select "Joint" if you file your taxes as a married couple.',
      enum: Object.values(FilingStatus),
    },
    household_size: {
      type: 'integer',
      description:
        'Include anyone you live with who you claim as a dependent on your taxes, and your spouse or partner if you file taxes together.',
      minimum: 1,
      maximum: 8,
      examples: [
        2,
      ],
    },
    language: {
      type: 'string',
      description:
        'Optional choice of language for `item`, `program` and `item_url` properties.',
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
  additionalProperties: false,
  oneOf: [
    { required: ['location'] },
    { required: ['zip'] },
    { required: ['address'] },
  ],
  required: [
    'owner_status',
    'household_income',
    'tax_filing',
    'household_size',
  ],
} as const;

export const API_CALCULATOR_RESPONSE_SCHEMA = {
  $id: 'APICalculatorResponse',
  type: 'object',
  required: [
    'is_under_80_ami',
    'is_under_150_ami',
    'is_over_150_ami',
    'authorities',
    'coverage',
    'location',
    'incentives',
  ],
  properties: {
    is_under_80_ami: {
      type: 'boolean',
    },
    is_under_150_ami: {
      type: 'boolean',
    },
    is_over_150_ami: {
      type: 'boolean',
    },
    authorities: {
      type: 'object',
      additionalProperties: API_AUTHORITY_SCHEMA,
    },
    coverage: API_COVERAGE_SCHEMA,
    location: API_RESPONSE_LOCATION_SCHEMA,
    data_partners: {
      type: 'object',
      additionalProperties: API_DATA_PARTNER_SCHEMA,
    },
    incentives: {
      type: 'array',
      items: { $ref: 'APIIncentive' },
    },
  },
  additionalProperties: false,
} as const;

export const API_CALCULATOR_SCHEMA = {
  description:
    'How much money will your customer get with the Inflation Reduction Act?',
  querystring: API_CALCULATOR_REQUEST_SCHEMA,
  response: {
    200: {
      $ref: 'APICalculatorResponse',
    },
    400: {
      $ref: 'Error',
    },
  },
} as const;

export type APICalculatorRequest = FromSchema<
  typeof API_CALCULATOR_REQUEST_SCHEMA
>;
export type APICalculatorResponse = FromSchema<
  typeof API_CALCULATOR_RESPONSE_SCHEMA,
  { references: [typeof API_INCENTIVE_SCHEMA] }
>;
