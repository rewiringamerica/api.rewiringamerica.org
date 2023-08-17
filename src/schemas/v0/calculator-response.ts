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
  examples: [
    {
      is_under_80_ami: true,
      is_under_150_ami: true,
      is_over_150_ami: false,
      pos_savings: 14000,
      tax_savings: 6081,
      performance_rebate_savings: 8000,
      estimated_annual_savings: 1040,
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

export type WebsiteCalculatorResponse = FromSchema<
  typeof WEBSITE_CALCULATOR_RESPONSE_SCHEMA,
  { references: [typeof WEBSITE_INCENTIVE_SCHEMA] }
>;
