import { JSONSchemaType } from 'ajv';
import fs from 'fs';
import { FilingStatus } from './tax_brackets';
import { Amount, AmountType, AmountUnit } from './types/amount';
import { ItemType, Type, TypeV0 } from './types/incentive-types';
import { ALL_ITEMS, Item } from './types/items';
import { OwnerStatus } from './types/owner-status';
import { ALL_PROGRAMS } from './types/programs';

export enum AmiQualification {
  LessThan150_Ami = 'less_than_150_ami',
  LessThan80_Ami = 'less_than_80_ami',
  MoreThan80_Ami = 'more_than_80_ami',
}

export interface Incentive {
  agi_max_limit: number | null;
  ami_qualification: AmiQualification | null;
  amount: Amount;
  end_date: number;
  filing_status: FilingStatus | null;
  item: Item;
  item_type: ItemType;
  owner_status: OwnerStatus[];
  program: string;
  start_date: number;
  type: TypeV0;
  short_description?: string;
}

// Work around https://github.com/ajv-validator/ajv/issues/1664
// This adds { type: 'null' } to a sub-schema but hides it from TSC.
// The test-time validation logic will accept null as a valid value.
const nullable = <T>(input: T): T => {
  return { anyOf: [input, { type: 'null' }] } as T;
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

export const SCHEMA: JSONSchemaType<Incentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: [Type.PosRebate, Type.TaxCredit] },
      program: { type: 'string', enum: ALL_PROGRAMS },
      item: { type: 'string', enum: ALL_ITEMS },
      item_type: { type: 'string', enum: Object.values(ItemType) },
      amount: amountSchema,
      owner_status: {
        type: 'array',
        items: { type: 'string', enum: Object.values(OwnerStatus) },
        minItems: 1,
        uniqueItems: true,
      },
      ami_qualification: nullable({
        type: 'string',
        enum: Object.values(AmiQualification),
      }),
      agi_max_limit: nullable({ type: 'integer' }),
      filing_status: nullable({
        type: 'string',
        enum: Object.values(FilingStatus),
      }),
      start_date: { type: 'number' },
      end_date: { type: 'number' },
      short_description: { type: 'string', nullable: true, maxLength: 150 },
    },
    required: [
      'agi_max_limit',
      'ami_qualification',
      'amount',
      'end_date',
      'filing_status',
      'item',
      'item_type',
      'owner_status',
      'program',
      'start_date',
      'type',
    ],
  },
};

export const IRA_INCENTIVES: Incentive[] = JSON.parse(
  fs.readFileSync('./data/ira_incentives.json', 'utf-8'),
);
