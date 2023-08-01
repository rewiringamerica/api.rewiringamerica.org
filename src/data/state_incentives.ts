import fs from 'fs';
import { JSONSchemaType } from 'ajv';
import {
  Amount,
  AmountType,
  AmountUnit,
  ItemType,
  OwnerStatus,
  Type,
} from './ira_incentives.js';
import { ALL_ITEMS } from './items.js';
import { AuthorityType } from './authorities.js';

export type StateIncentive = {
  authority_type: AuthorityType;
  authority: string;
  type: Type;
  item: string;
  item_type: ItemType;
  program: string;
  amount: Amount;
  bonus_available?: boolean;
  owner_status: OwnerStatus[];
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
  authority_type: { type: 'string', enum: Object.values(AuthorityType) },
  authority: { type: 'string' },
  type: { type: 'string', enum: Object.values(Type) },
  item: { type: 'string', enum: ALL_ITEMS },
  item_type: { type: 'string', enum: Object.values(ItemType) },
  program: { type: 'string' },
  amount: amountSchema,
  bonus_available: { type: 'boolean', nullable: true },
  owner_status: {
    type: 'array',
    items: { type: 'string', enum: Object.values(OwnerStatus) },
  },
} as const;
const requiredProperties = [
  'authority',
  'authority_type',
  'type',
  'item',
  'item_type',
  'program',
  'amount',
  'owner_status',
] as const;

/******************************************************************************/
/* State-specific types/schemas                                               */
/******************************************************************************/

export type RIIncentive = StateIncentive & {
  low_income?: boolean;
};

export const RI_INCENTIVES_SCHEMA: JSONSchemaType<RIIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      ...incentivePropertySchema,
      low_income: { type: 'boolean', nullable: true },
    },
    required: requiredProperties,
  },
} as const;

export const RI_INCENTIVES: RIIncentive[] = JSON.parse(
  fs.readFileSync('./data/RI/incentives.json', 'utf-8'),
);
