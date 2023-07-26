import { ERROR_SCHEMA } from '../error.js';
import { API_INCENTIVE_SCHEMA } from './incentive.js';
import { API_LOCATION_SCHEMA } from './location.js';

const API_CALCULATOR_REQUEST_SCHEMA = {
  $id: 'APICalculatorRequest',
  title: 'APICalculatorRequest',
  type: 'object',
  properties: {
    location: API_LOCATION_SCHEMA,
    owner_status: {
      type: 'string',
      description: 'Homeowners and renters qualify for different incentives.',
      enum: [
        'homeowner',
        'renter',
      ],
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
      enum: [
        'single',
        'joint',
        'hoh',
      ],
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
  },
  required: [
    'location',
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
    'pos_savings',
    'tax_savings',
    'performance_rebate_savings',
    'pos_rebate_incentives',
    'tax_credit_incentives',
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
    pos_savings: {
      type: 'integer',
      description:
        'The max POS savings is $14,000 if you’re under 150% ami, otherwise 0',
    },
    tax_savings: {
      type: 'integer',
      description:
        'You can’t save more than tax owed. Uses the lesser of tax owed vs tax savings.',
    },
    performance_rebate_savings: {
      type: 'integer',
    },
    pos_rebate_incentives: {
      type: 'array',
      items: API_INCENTIVE_SCHEMA,
    },
    tax_credit_incentives: {
      type: 'array',
      items: API_INCENTIVE_SCHEMA,
    },
  },
  examples: [
    {
      is_under_80_ami: true,
      is_under_150_ami: true,
      is_over_150_ami: false,
      pos_savings: 14000,
      tax_savings: 6081,
      performance_rebate_savings: 8000,
      pos_rebate_incentives: [
        {
          type: 'pos_rebate',
          program: 'HEEHR',
          program_es: 'HEEHR',
          item: 'Electric Panel',
          item_es: 'Cuadro eléctrico',
          more_info_url: '/app/ira-calculator/information/electrical-panel',
          more_info_url_es: '/app/ira-calculator/information/cuadro-electrico',
          amount: 4000,
          amount_type: 'dollar_amount',
          representative_amount: null,
          item_type: 'pos_rebate',
          owner_status: [
            'homeowner',
          ],
          ami_qualification: 'less_than_80_ami',
          agi_max_limit: null,
          filing_status: null,
          start_date: 2023,
          end_date: 2032,
          eligible: true,
        },
      ],
      tax_credit_incentives: [
        {
          type: 'tax_credit',
          program: 'Residential Clean Energy Credit (25D)',
          program_es: 'Crédito de energía limpia residencial (25D)',
          item: 'Battery Storage Installation',
          item_es: 'Instalación de baterías',
          more_info_url:
            '/app/ira-calculator/information/battery-storage-installation',
          more_info_url_es:
            '/app/ira-calculator/information/instalacion-de-baterias',
          amount: 0.3,
          amount_type: 'percent',
          representative_amount: 4800,
          item_type: 'tax_credit',
          owner_status: [
            'homeowner',
          ],
          ami_qualification: null,
          agi_max_limit: null,
          filing_status: null,
          start_date: 2023,
          end_date: 2032,
          eligible: true,
        },
      ],
    },
  ],
} as const;

export const API_CALCULATOR_SCHEMA = {
  description:
    'How much money will your customer get with the Inflation Reduction Act?',
  querystring: API_CALCULATOR_REQUEST_SCHEMA,
  response: {
    200: {
      description: 'Successful response',
      ...API_CALCULATOR_RESPONSE_SCHEMA,
    },
    400: {
      description: 'Bad request',
      ...ERROR_SCHEMA,
    },
  },
} as const;
