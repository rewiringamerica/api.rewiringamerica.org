import { FromSchema } from 'json-schema-to-ts';

export const API_INCENTIVE_SCHEMA = {
  type: 'object',
  required: [
    'type',
    'program',
    'item',
    'item_url',
    'item_type',
    'amount',
    'amount_type',
    'owner_status',
    'start_date',
    'end_date',
  ],
  properties: {
    type: {
      type: 'string',
      enum: [
        'pos_rebate',
        'tax_credit',
      ],
    },
    program: {
      type: 'string',
      examples: [
        'Residential Clean Energy Credit (25D)',
      ],
    },
    item: {
      type: 'string',
      examples: [
        'Battery Storage Installation',
      ],
    },
    item_url: {
      type: 'string',
      examples: [
        'https://www.rewiringamerica.org/app/ira-calculator/information/battery-storage-installation',
      ],
    },
    amount: {
      type: 'number',
      examples: [
        4800,
      ],
    },
    amount_type: {
      type: 'string',
      enum: [
        'dollar_amount',
        'percent',
      ],
    },
    item_type: {
      type: 'string',
      enum: [
        'performance_rebate',
        'pos_rebate',
        'tax_credit',
        'solar_tax_credit',
        'ev_charger_credit',
      ],
    },
    owner_status: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'homeowner',
          'renter',
        ],
      },
    },
    start_date: {
      type: 'number',
      examples: [
        2023,
      ],
    },
    end_date: {
      type: 'number',
      examples: [
        2032,
      ],
    },
    special_note: {
      type: 'string',
      examples: [
        null,
      ],
    },
    representative_amount: {
      type: 'number',
      nullable: true,
      examples: [
        4800,
      ],
    },
    ami_qualification: {
      type: 'string',
      nullable: true,
      enum: [
        'less_than_80_ami',
        'less_than_150_ami',
        'more_than_80_ami',
        null,
      ],
    },
    agi_max_limit: {
      type: 'number',
      nullable: true,
      examples: [
        null,
        150000,
      ],
    },
    filing_status: {
      type: 'string',
      nullable: true,
      enum: [
        'single',
        'joint',
        'hoh',
        null,
      ],
    },
    eligible: {
      type: 'boolean',
    },
  },
  examples: [
    {
      type: 'pos_rebate',
      program: 'Energy Efficient Home Improvement Credit (25C)',
      item: 'Electric Panel',
      item_url:
        'https://rewiringamerica.org/app/ira-calculator/information/electrical-panel',
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
} as const;

export type APIIncentive = FromSchema<typeof API_INCENTIVE_SCHEMA>;
