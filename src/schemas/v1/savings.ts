import { FromSchema } from 'json-schema-to-ts';

export const API_SAVINGS_SCHEMA = {
  type: 'object',
  properties: {
    pos_rebate: {
      type: 'integer',
    },
    tax_credit: {
      type: 'integer',
      description:
        'You can’t save more than tax owed. Uses the lesser of tax owed vs tax savings.',
    },
    performance_rebate: {
      type: 'integer',
    },
  },
  required: ['pos_rebate', 'tax_credit', 'performance_rebate'],
  additionalProperties: false,
} as const;

export type APISavings = FromSchema<typeof API_SAVINGS_SCHEMA>;
