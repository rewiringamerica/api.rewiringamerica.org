import { FromSchema } from 'json-schema-to-ts';
import { AuthorityType } from '../../data/authorities';
import { AmiQualification } from '../../data/ira_incentives';
import { FilingStatus } from '../../data/tax_brackets';
import { AmountType, AmountUnit } from '../../data/types/amount';
import { PaymentMethod, Type } from '../../data/types/incentive-types';
import { ALL_ITEMS } from '../../data/types/items';
import { OwnerStatus } from '../../data/types/owner-status';

export const API_INCENTIVE_SCHEMA = {
  $id: 'APIIncentive',
  type: 'object',
  required: [
    'type',
    'authority_type',
    'program',
    'item',
    'item_type',
    'payment_methods',
    'amount',
    'owner_status',
    'start_date',
    'end_date',
  ],
  properties: {
    type: {
      type: 'string',
      enum: Object.values(Type),
    },
    authority_type: {
      type: 'string',
      enum: Object.values(AuthorityType),
    },
    authority: {
      type: 'string',
    },
    program: {
      type: 'string',
      examples: [
        'Residential Clean Energy Credit (25D)',
      ],
    },
    program_url: {
      type: 'string',
    },
    item: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ALL_ITEMS,
        },
        name: {
          type: 'string',
          examples: [
            'Battery Storage Installation',
          ],
        },
        url: {
          type: 'string',
          examples: [
            'https://www.rewiringamerica.org/app/ira-calculator/information/battery-storage-installation',
          ],
        },
      },
      required: ['type', 'name', 'url'],
      additionalProperties: false,
    },
    amount: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: Object.values(AmountType),
        },
        number: { type: 'number' },
        maximum: { type: 'number' },
        representative: { type: 'number' },
        unit: {
          type: 'string',
          enum: Object.values(AmountUnit),
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
      enum: Object.values(PaymentMethod),
    },
    payment_methods: {
      type: 'array',
      items: {
        type: 'string',
        enum: Object.values(PaymentMethod),
      }
    },
    owner_status: {
      type: 'array',
      items: {
        type: 'string',
        enum: Object.values(OwnerStatus),
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
      enum: [...Object.values(AmiQualification), null],
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
      enum: [...Object.values(FilingStatus), null],
    },
    eligible: {
      type: 'boolean',
    },
    short_description: {
      type: 'string',
      examples: [
        'A 150 character (or shorter) display description for the incentive.',
      ],
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
      payment_methods: [
        'pos_rebate'
      ],
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
