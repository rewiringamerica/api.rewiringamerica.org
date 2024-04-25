import { FromSchema } from 'json-schema-to-ts';
import { AuthorityType } from '../../data/authorities';
import { AmiQualification } from '../../data/ira_incentives';
import { FilingStatus } from '../../data/tax_brackets';
import { AmountType, AmountUnit } from '../../data/types/amount';
import { PaymentMethod } from '../../data/types/incentive-types';
import { ALL_ITEMS } from '../../data/types/items';
import { OwnerStatus } from '../../data/types/owner-status';

export const API_INCENTIVE_SCHEMA = {
  $id: 'APIIncentive',
  type: 'object',
  required: [
    'payment_methods',
    'authority_type',
    'program',
    'program_url',
    'item',
    'items',
    'amount',
    'owner_status',
  ],
  properties: {
    payment_methods: {
      type: 'array',
      items: {
        type: 'string',
        enum: Object.values(PaymentMethod),
      },
      minItems: 1,
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
    },
    program_url: {
      type: 'string',
    },
    more_info_url: {
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
        },
      },
      required: ['type'],
      additionalProperties: false,
    },
    items: {
      type: 'array',
      items: {
        type: 'string',
        enum: ALL_ITEMS,
      },
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
    owner_status: {
      type: 'array',
      items: {
        type: 'string',
        enum: Object.values(OwnerStatus),
      },
      minItems: 1,
    },
    start_date: {
      type: 'string',
    },
    end_date: {
      type: 'string',
    },
    special_note: {
      type: 'string',
    },
    ami_qualification: {
      type: 'string',
      nullable: true,
      enum: [...Object.values(AmiQualification), null],
    },
    agi_max_limit: {
      type: 'number',
      nullable: true,
    },
    agi_min_limit: {
      type: 'number',
      nullable: true,
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
      description:
        'A 150 character (or shorter) display description for the incentive.',
    },
  },
  additionalProperties: false,
} as const;

export type APIIncentive = FromSchema<typeof API_INCENTIVE_SCHEMA>;
