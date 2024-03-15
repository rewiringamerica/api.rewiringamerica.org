import { FromSchema } from 'json-schema-to-ts';
import { AmiQualification } from '../../data/ira_incentives';
import { FilingStatus } from '../../data/tax_brackets';
import { PaymentMethod } from '../../data/types/incentive-types';
import { OwnerStatus } from '../../data/types/owner-status';

export const WEBSITE_INCENTIVE_SCHEMA = {
  $id: 'WebsiteIncentive',
  title: 'WebsiteIncentive',
  type: 'object',
  required: [
    'type',
    'program',
    'program_es',
    'item',
    'item_es',
    'more_info_url',
    'more_info_url_es',
    'amount',
    'amount_type',
    'item_type',
    'owner_status',
    'start_date',
    'end_date',
  ],
  properties: {
    type: {
      type: 'string',
      enum: [PaymentMethod.PosRebate, PaymentMethod.TaxCredit],
    },
    program: {
      type: 'string',
      description: 'The name of the incentive program, in English.',
    },
    program_es: {
      type: 'string',
      description: 'The name of the incentive program, in Spanish.',
    },
    item: {
      type: 'string',
      description:
        'The equipment or project that this incentive is for, in English.',
    },
    item_es: {
      type: 'string',
      description:
        'The equipment or project that this incentive is for, in Spanish.',
    },
    more_info_url: {
      type: 'string',
      description:
        'A URL to more information, in English, about the equipment or project.',
    },
    more_info_url_es: {
      type: 'string',
      description:
        'A URL to more information, in Spanish, about the equipment or project.',
    },
    amount: {
      type: 'number',
      description:
        'Depending on `amount_type`, either a dollar amount, or a number between 0 and 1 indicating a percentage.',
    },
    amount_type: {
      type: 'string',
      description: 'The significance of the `amount` field.',
      enum: [
        'dollar_amount',
        'percent',
        'solar',
      ],
    },
    item_type: {
      type: 'string',
      enum: [
        PaymentMethod.PosRebate,
        PaymentMethod.PerformanceRebate,
        PaymentMethod.TaxCredit,
        'solar_tax_credit',
        'ev_charger_credit',
      ],
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
      description:
        'The four-digit year in which the incentive begins, or began, to be available.',
    },
    end_date: {
      type: 'number',
      description:
        'The four-digit year in which the incentive stops, or stopped, being available.',
    },
    special_note: {
      type: 'string',
      description: 'Not used.',
    },
    representative_amount: {
      type: 'number',
      description: 'A dollar amount that this incentive is typically worth.',
    },
    ami_qualification: {
      type: 'string',
      description:
        'The income level required for this incentive, expressed as a percentage of Area Median Income (AMI).',
      nullable: true,
      enum: [...Object.values(AmiQualification), null],
    },
    agi_max_limit: {
      type: 'number',
      description:
        'The maximum Adjusted Gross Income (AGI) to be eligible for this incentive.',
    },
    agi_min_limit: {
      type: 'number',
      description:
        'The minimum Adjusted Gross Income (AGI) to be eligible for this incentive.',
    },
    filing_status: {
      type: 'string',
      description: 'Which tax filing statuses are eligible for this incentive.',
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
    // TODO: remove when PEP is migrated to v1 API
    more_info_url_internal: {
      type: 'string',
      description:
        'Temporary more info URL to support internal RA consumer site until migration to V1',
    },
  },
  additionalProperties: false,
} as const;

export type WebsiteIncentive = FromSchema<typeof WEBSITE_INCENTIVE_SCHEMA>;
