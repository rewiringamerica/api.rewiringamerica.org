import { JSONSchemaType } from 'ajv';
import fs from 'fs';
import { AuthorityType } from './authorities';
import { COLowIncomeAuthority, RILowIncomeAuthority } from './low_income_thresholds';
import { ALL_PROGRAMS } from './programs';
import { FilingStatus } from './tax_brackets';
import { Amount, AmountType, AmountUnit } from './types/amount';
import { PaymentMethod } from './types/incentive-types';
import { ALL_ITEMS, Item } from './types/items';
import { LocalizableString } from './types/localizable-string';
import { OwnerStatus } from './types/owner-status';

export type LowIncomeAuthority = 'default' | RILowIncomeAuthority | COLowIncomeAuthority;

export type StateIncentive = {
  id: string;
  agi_max_limit?: number;
  agi_min_limit?: number;
  authority_type: AuthorityType;
  authority: string;
  type: PaymentMethod; // Deprecated; we are switching to use payment_methods instead
  payment_methods: PaymentMethod[];
  item: Item;
  program: string;
  amount: Amount;
  bonus_available?: boolean;
  owner_status: OwnerStatus[];
  start_date: number;
  end_date: number;
  short_description: LocalizableString;
  low_income?: LowIncomeAuthority;
  filing_status?: FilingStatus;
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
  agi_max_limit: { type: 'integer', nullable: true },
  agi_min_limit: { type: 'integer', nullable: true },
  authority_type: { type: 'string', enum: Object.values(AuthorityType) },
  authority: { type: 'string' },
  type: { type: 'string', enum: Object.values(PaymentMethod) },
  payment_methods: {
    type: 'array',
    items: { type: 'string', enum: Object.values(PaymentMethod) },
  },
  item: { type: 'string', enum: ALL_ITEMS },
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
  filing_status: {
    type: 'string',
    enum: Object.values(FilingStatus),
    nullable: true,
  },
} as const;
const requiredProperties = [
  'id',
  'authority',
  'authority_type',
  'type',
  'payment_methods',
  'item',
  'program',
  'amount',
  'owner_status',
  'short_description',
] as const;

export const STATE_SCHEMA: JSONSchemaType<StateIncentive> = {
  type: 'object',
  properties: {
    ...incentivePropertySchema,
  },
  required: requiredProperties,
} as const;

/******************************************************************************/
/* State-specific types/schemas                                               */
/******************************************************************************/

export const AZ_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      ...incentivePropertySchema,
    },
    required: requiredProperties,
  },
} as const;

export const AZ_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/AZ/incentives.json', 'utf-8'),
);

export const CO_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      ...incentivePropertySchema,
    },
    required: requiredProperties,
  },
} as const;



export const CO_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/CO/incentives.json', 'utf-8'),
);

export const CT_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
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
    additionalProperties: false,
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
    additionalProperties: false,
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
    additionalProperties: false,
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
    additionalProperties: false,
  },
} as const;

export const VT_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/VT/incentives.json', 'utf-8'),
);

export const STATE_INCENTIVES_BY_STATE: StateIncentivesMap = {
  AZ: AZ_INCENTIVES,
  CO: CO_INCENTIVES,
  CT: CT_INCENTIVES,
  NY: NY_INCENTIVES,
  RI: RI_INCENTIVES,
  VA: VA_INCENTIVES,
  VT: VT_INCENTIVES,
};
