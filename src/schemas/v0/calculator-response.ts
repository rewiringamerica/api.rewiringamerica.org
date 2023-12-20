import { FromSchema } from 'json-schema-to-ts';
import { WEBSITE_INCENTIVE_SCHEMA } from './incentive';

export const WEBSITE_CALCULATOR_RESPONSE_SCHEMA = {
  $id: 'WebsiteCalculatorResponse',
  type: 'object',
  required: [
    'is_under_80_ami',
    'is_under_150_ami',
    'is_over_150_ami',
    'pos_savings',
    'tax_savings',
    'performance_rebate_savings',
    'estimated_annual_savings',
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
    estimated_annual_savings: {
      type: 'integer',
      description:
        'This estimate is based on energy costs in your state. It includes savings on both utility and gasoline bills if you switch to an electric vehicle and a heat pump for space and water heating. See our FAQ for more on how we estimate this number.',
    },
    pos_rebate_incentives: {
      type: 'array',
      items: {
        $ref: 'WebsiteIncentive',
      },
    },
    tax_credit_incentives: {
      type: 'array',
      items: {
        $ref: 'WebsiteIncentive',
      },
    },
  },
  additionalProperties: false,
} as const;

export type WebsiteCalculatorResponse = FromSchema<
  typeof WEBSITE_CALCULATOR_RESPONSE_SCHEMA,
  { references: [typeof WEBSITE_INCENTIVE_SCHEMA] }
>;
