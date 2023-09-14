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
    account_credit: { type: 'integer' },
    rebate: { type: 'integer' },
    assistance_program: {
      type: 'integer',
      description:
        'This may represent no-cost products or services rather than a monetary value.',
    },
  },
  required: [
    'pos_rebate',
    'tax_credit',
    'performance_rebate',
    'account_credit',
    'rebate',
  ],
  additionalProperties: false,
} as const;

export type APISavings = FromSchema<typeof API_SAVINGS_SCHEMA>;

export const zeroSavings = (): APISavings => ({
  tax_credit: 0,
  pos_rebate: 0,
  performance_rebate: 0,
  rebate: 0,
  account_credit: 0,
});

export const addSavings = (a: APISavings, b: APISavings): APISavings => ({
  tax_credit: a.tax_credit + b.tax_credit,
  pos_rebate: a.pos_rebate + b.pos_rebate,
  performance_rebate: a.performance_rebate + b.performance_rebate,
  rebate: a.rebate + b.rebate,
  account_credit: a.account_credit + b.account_credit,
});
