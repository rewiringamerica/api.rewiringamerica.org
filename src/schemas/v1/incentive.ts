import { FromSchema } from 'json-schema-to-ts';

export const API_INCENTIVE_SCHEMA = {
  $id: 'APIIncentive',
  type: 'object',
  required: [
    'type',
    'authority_type',
    'program',
    'item',
    'item_url',
    'item_type',
    'amount',
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
    authority_type: {
      type: 'string',
      enum: ['federal', 'state', 'utility'],
    },
    authority_name: {
      type: 'string',
      nullable: true,
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
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            'dollar_amount',
            'percent',
            'dollars_per_unit',
          ],
        },
        number: { type: 'number' },
        maximum: { type: 'number' },
        representative: { type: 'number' },
        unit: {
          type: 'string',
          enum: [
            'ton',
            'watt',
          ],
        },
      },
      additionalProperties: false,
      required: [
        'type',
        'number',
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
  additionalProperties: false,
  examples: [
    {
      type: 'pos_rebate',
      authority_type: 'federal',
      program: 'Energy Efficient Home Improvement Credit (25C)',
      item: 'Electric Panel',
      item_url:
        'https://rewiringamerica.org/app/ira-calculator/information/electrical-panel',
      amount: {
        type: 'dollars_per_unit',
        number: 0.65,
        unit: 'watt',
        maximum: 5000,
        representative: 3000,
      },
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

/**
 * This is used internally, as an intermediate form between incentive
 * calculation and external API.
 */
export type APIIncentiveMinusItemUrl = Omit<APIIncentive, 'item_url'>;
