import { JSONSchemaType } from 'ajv';
import fs from 'fs';
import { AMOUNT_SCHEMA } from './types/amount';

import { START_END_DATE_REGEX } from '../lib/dates';
import { PROGRAMS } from './programs';
import { Amount } from './types/amount';
import { PaymentMethod } from './types/incentive-types';
import { ALL_ITEMS, Item } from './types/items';
import { LocalizableString } from './types/localizable-string';
import { OwnerStatus } from './types/owner-status';
import { STATES_AND_TERRITORIES } from './types/states';

export type StateIncentive = {
  id: string;
  items: Item[];
  short_description: LocalizableString;
  start_date?: string;
  end_date?: string;
  payment_methods: PaymentMethod[];
  amount: Amount;
  owner_status: OwnerStatus[];
  eligible_geo_group?: string;
  program: string;
  bonus_available?: boolean;
  low_income?: string;
  more_info_url?: LocalizableString;
};

const incentivePropertySchema = {
  id: { type: 'string' },
  items: {
    type: 'array',
    items: { type: 'string', enum: ALL_ITEMS },
  },
  short_description: { $ref: 'LocalizableString' },
  start_date: {
    type: 'string',
    pattern: START_END_DATE_REGEX.source,
    nullable: true,
  },
  end_date: {
    type: 'string',
    pattern: START_END_DATE_REGEX.source,
    nullable: true,
  },
  payment_methods: {
    type: 'array',
    items: { type: 'string', enum: Object.values(PaymentMethod) },
    minItems: 1,
  },
  amount: AMOUNT_SCHEMA,
  owner_status: {
    type: 'array',
    items: { type: 'string', enum: Object.values(OwnerStatus) },
    minItems: 1,
  },
  eligible_geo_group: { type: 'string', nullable: true },
  program: { type: 'string', enum: Object.keys(PROGRAMS) },
  bonus_available: { type: 'boolean', nullable: true },
  low_income: { type: 'string', nullable: true },
  more_info_url: {
    $ref: 'LocalizableString',
  },
} as const;

export type StateIncentivesMap = {
  [stateId: string]: StateIncentive[];
};

const requiredProperties = [
  'id',
  'payment_methods',
  'items',
  'program',
  'amount',
  'owner_status',
  'short_description',
] as const;

export const STATE_SCHEMA: JSONSchemaType<StateIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      ...incentivePropertySchema,
    },
    required: requiredProperties,
    additionalProperties: false,
  },
} as const;

/******************************************************************************/
/* State-specific types/schemas                                               */
/******************************************************************************/

export const STATE_INCENTIVES_BY_STATE: StateIncentivesMap = (() => {
  const result: StateIncentivesMap = {};
  for (const state of STATES_AND_TERRITORIES) {
    const incentivesPath = `./data/${state}/incentives.json`;
    if (fs.existsSync(incentivesPath)) {
      result[state] = JSON.parse(fs.readFileSync(incentivesPath, 'utf-8'));
    }
  }
  return result;
})();
