import { FromSchema } from 'json-schema-to-ts';
import {
  API_AUTHORITY_SCHEMA,
  AuthorityType,
  NO_GAS_UTILITY,
} from '../../data/authorities';
import { API_DATA_PARTNER_SCHEMA } from '../../data/data_partners';
import { FilingStatus } from '../../data/tax_brackets';
import { API_COVERAGE_SCHEMA } from '../../data/types/coverage';
import { ALL_ITEMS } from '../../data/types/items';
import { OwnerStatus } from '../../data/types/owner-status';
import { API_INCENTIVE_SCHEMA } from './incentive';
import { API_RESPONSE_LOCATION_SCHEMA } from './location';

const API_CALCULATOR_REQUEST_SCHEMA = {
  title: 'APICalculatorRequest',
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
absent, no incentives offered by electric utilities will be returned.`,
    },
    gas_utility: {
      type: 'string',
      description: `The ID of your gas utility company, as returned from \
\`/api/v1/utilities\`, or the special string \`${NO_GAS_UTILITY}\` indicating \
that you do not have gas service. A value other than \`${NO_GAS_UTILITY}\` is \
required if authority_types includes "gas_utility". If this parameter is \
absent or \`${NO_GAS_UTILITY}\`, no incentives offered by gas utilities will \
be returned. In some jurisdictions, your gas utility can affect your \
eligibility for incentives offered by other authorities; in such cases, if \
this parameter is absent, incentives with gas-utility-dependent eligibility \
will _not_ be returned.`,
    },
    items: {
      type: 'array',
      description: `Which types of product or service to fetch incentives for. \
If absent, include incentives for all products and services. Pass multiple \
values either comma-separated \
(\`items=new_electric_vehicle,used_electric_vehicle\`), or as the same GET \
parameter multiple times \
(\`items=new_electric_vehicle&items=used_electric_vehicle\`), or using empty \
square bracket notation \
(\`items[]=new_electric_vehicle&items[]=used_electric_vehicle\`).`,
      items: {
        type: 'string',
        enum: ALL_ITEMS,
      },
      minItems: 1,
      uniqueItems: true,
    },
    owner_status: {
      type: 'string',
      description: 'Whether the consumer owns or rents their home.',
      enum: Object.values(OwnerStatus),
    },
    household_income: {
      type: 'integer',
      description: `The consumer's gross income (pre-tax). Include wages and \
salary plus other forms of income, including pensions, interest, dividends, \
and rental income. Married taxpayers filing jointly should include their \
spouse's income.`,
      minimum: 0,
      maximum: 100000000,
      examples: [
        80000,
      ],
    },
    tax_filing: {
      type: 'string',
      description:
        'The status under which the consumer files their taxes. If this \
parameter is absent, incentives whose eligibility depends on tax filing status \
will not be included in the results.',
      enum: Object.values(FilingStatus),
    },
    household_size: {
      type: 'integer',
      description: `The consumer's household size for tax purposes. Should \
include anyone the consumer lives with who they claim as a dependent on their \
taxes, and their spouse if they file taxes jointly.`,
      minimum: 1,
      maximum: 8,
      examples: [
        2,
      ],
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
      default: false,
    },
  },
  additionalProperties: false,
  oneOf: [
    { required: ['zip'] },
    { required: ['address'] },
  ],
  required: [
    'owner_status',
    'household_income',
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
      description: `Whether the given household income is below the "80% of \
Area Median Income" level for the given household size and location.`,
    },
    is_under_150_ami: {
      type: 'boolean',
      description: `Whether the given household income is below the "150% of \
Area Median Income" level for the given household size and location.`,
    },
    is_over_150_ami: {
      type: 'boolean',
      description: `Whether the given household income is above the "150% of \
Area Median Income" level for the given household size and location.`,
    },
    authorities: {
      type: 'object',
      description: `Information on the entities (government agencies, \
companies, other organizations) that offer incentives in this result set.`,
      additionalProperties: API_AUTHORITY_SCHEMA,
    },
    coverage: API_COVERAGE_SCHEMA,
    location: API_RESPONSE_LOCATION_SCHEMA,
    data_partners: {
      type: 'object',
      description: `Information on organizations that assist in collecting, \
verifying, and maintaining incentive data included in this result set.`,
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
  summary: 'Find eligible incentives',
  description: `Compute incentives for which the user is eligible, given the \
criteria in the request parameters.`,
  operationId: 'getCalculatedIncentives',
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
