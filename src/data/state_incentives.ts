import { JSONSchemaType } from 'ajv';
import fs from 'fs';
import { AuthorityType } from './authorities';
import { RILowIncomeAuthority } from './low_income_thresholds';
import { ALL_PROGRAMS } from './programs';
import { Amount, AmountType, AmountUnit } from './types/amount';
import { ItemType, PaymentMethod } from './types/incentive-types';
import { ALL_ITEMS, Item } from './types/items';
import { LocalizableString } from './types/localizable-string';
import { OwnerStatus } from './types/owner-status';

export type LowIncomeAuthority = 'default' | RILowIncomeAuthority;

export type StateIncentive = {
  id: string;
  authority_type: AuthorityType;
  authority: string;
  type: PaymentMethod; // Deprecated; we are switching to use payment_methods instead
  payment_methods: PaymentMethod[];
  item: Item;
  item_type: ItemType;
  program: string;
  amount: Amount;
  bonus_available?: boolean;
  owner_status: OwnerStatus[];
  start_date: number;
  end_date: number;
  short_description: LocalizableString;
  low_income?: LowIncomeAuthority;
};

export type StateIncentivesMap = {
  [stateId: string]: StateIncentive[];
};

const amountSchema: JSONSchemaType<Amount> = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: Object.values(AmountType) },
    number: { type: 'number' },
    unit: { type: 'string', enum: Object.values(AmountUnit), nullable: true },
    maximum: { type: 'number', nullable: true },
    representative: { type: 'number', nullable: true },
  },
  required: ['type', 'number'],
} as const;

const incentivePropertySchema = {
  id: { type: 'string' },
  authority_type: { type: 'string', enum: Object.values(AuthorityType) },
  authority: { type: 'string' },
  type: { type: 'string', enum: Object.values(PaymentMethod) },
  payment_methods: {
    type: 'array',
    items: { type: 'string', enum: Object.values(PaymentMethod) },
  },
  item: { type: 'string', enum: ALL_ITEMS },
  item_type: { type: 'string', enum: Object.values(ItemType) },
  program: { type: 'string', enum: ALL_PROGRAMS },
  amount: amountSchema,
  bonus_available: { type: 'boolean', nullable: true },
  owner_status: {
    type: 'array',
    items: { type: 'string', enum: Object.values(OwnerStatus) },
  },
  start_date: {
    type: 'number',
  },
  end_date: {
    type: 'number',
  },
  short_description: { $ref: 'LocalizableString' },
  low_income: { type: 'string', nullable: true },
} as const;
const requiredProperties = [
  'id',
  'authority',
  'authority_type',
  'type',
  'payment_methods',
  'item',
  'item_type',
  'program',
  'amount',
  'owner_status',
  'short_description',
] as const;

/******************************************************************************/
/* State-specific types/schemas                                               */
/******************************************************************************/

export const CT_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      ...incentivePropertySchema,
    },
    required: requiredProperties,
  },
} as const;

export const CT_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/CT/incentives.json', 'utf-8'),
);

export const NY_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      ...incentivePropertySchema,
    },
    required: requiredProperties,
  },
} as const;

export const NY_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/NY/incentives.json', 'utf-8'),
);

export const RI_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      ...incentivePropertySchema,
    },
    required: requiredProperties,
  },
} as const;

export const RI_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/RI/incentives.json', 'utf-8'),
);
export const VA_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      ...incentivePropertySchema,
    },
    required: requiredProperties,
  },
} as const;

export const VA_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/VA/incentives.json', 'utf-8'),
);

export const VT_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      ...incentivePropertySchema,
    },
    required: requiredProperties,
  },
} as const;

export const VT_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/VT/incentives.json', 'utf-8'),
);

export const STATE_INCENTIVES_BY_STATE: StateIncentivesMap = {
  CT: CT_INCENTIVES,
  NY: NY_INCENTIVES,
  RI: RI_INCENTIVES,
  VA: VA_INCENTIVES,
  VT: VT_INCENTIVES,
};
