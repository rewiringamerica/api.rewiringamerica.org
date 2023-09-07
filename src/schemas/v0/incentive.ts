import { FromSchema } from 'json-schema-to-ts';
import { AmiQualification } from '../../data/ira_incentives';
import { FilingStatus } from '../../data/tax_brackets';
import { ItemType, Type } from '../../data/types/incentive-types';
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
      enum: Object.values(Type),
    },
    program: {
      type: 'string',
      examples: [
        'Residential Clean Energy Credit (25D)',
      ],
    },
    program_es: {
      type: 'string',
      examples: [
        'Crédito de energía limpia residencial (25D)',
      ],
    },
    item: {
      type: 'string',
      examples: [
        'Battery Storage Installation',
      ],
    },
    item_es: {
      type: 'string',
      examples: [
        'Instalación de baterías',
      ],
    },
    more_info_url: {
      type: 'string',
      examples: [
        'https://www.rewiringamerica.org/app/ira-calculator/information/battery-storage-installation',
      ],
    },
    more_info_url_es: {
      type: 'string',
      examples: [
        'https://www.rewiringamerica.org/app/ira-calculator/information/instalacion-de-baterias',
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
        'solar',
      ],
    },
    item_type: {
      type: 'string',
      enum: [...Object.values(ItemType), 'solar_tax_credit'],
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
    representative_amount: {
      type: 'number',
      examples: [
        4800,
      ],
    },
    ami_qualification: {
      type: 'string',
      nullable: true,
      enum: [...Object.values(AmiQualification), null],
    },
    agi_max_limit: {
      type: 'number',
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
  },
  additionalProperties: false,
  examples: [
    {
      type: 'pos_rebate',
      program: 'Energy Efficient Home Improvement Credit (25C)',
      program_es:
        'Crédito para la mejora de la eficiencia energética en el hogar (25C)',
      item: 'Electric Panel',
      item_es: 'Cuadro eléctrico',
      more_info_url:
        'https://rewiringamerica.org/app/ira-calculator/information/electrical-panel',
      more_info_url_es:
        'https://rewiringamerica.org/app/ira-calculator/information/cuadro-electrico',
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

export type WebsiteIncentive = FromSchema<typeof WEBSITE_INCENTIVE_SCHEMA>;
