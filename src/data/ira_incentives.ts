import { JSONSchemaType } from 'ajv';
import fs from 'fs';
import { AuthorityType } from './authorities';
import { ALL_PROGRAMS } from './programs';
import { FilingStatus } from './tax_brackets';
import { Amount, AmountType, AmountUnit } from './types/amount';
import {
  ItemType,
  PaymentMethod,
  PaymentMethodV0,
} from './types/incentive-types';
import { ALL_ITEMS, Item } from './types/items';
import { LocalizableString } from './types/localizable-string';
import { OwnerStatus } from './types/owner-status';

export enum AmiQualification {
  LessThan150_Ami = 'less_than_150_ami',
  LessThan80_Ami = 'less_than_80_ami',
  MoreThan80_Ami = 'more_than_80_ami',
}

export interface IRAIncentive {
  id: string;
  agi_max_limit: number | null;
  ami_qualification: AmiQualification | null;
  amount: Amount;
  authority_type: AuthorityType.Federal;
  end_date: number;
  filing_status: FilingStatus | null;
  item: Item;
  item_type: ItemType;
  owner_status: OwnerStatus[];
  program: string;
  start_date: number;
  type: PaymentMethodV0;
  payment_methods: PaymentMethod[];
  short_description: LocalizableString;
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

export const SCHEMA: JSONSchemaType<IRAIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: {
        type: 'string',
        enum: [PaymentMethod.PosRebate, PaymentMethod.TaxCredit],
      },
      payment_methods: {
        type: 'array',
        items: { type: 'string', enum: Object.values(PaymentMethod) },
      },
      program: { type: 'string', enum: ALL_PROGRAMS },
      authority_type: { type: 'string', const: AuthorityType.Federal },
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
      short_description: {
        $ref: 'LocalizableString',
      },
    },
    required: [
      'id',
      'agi_max_limit',
      'ami_qualification',
      'amount',
      'authority_type',
      'end_date',
      'filing_status',
      'item',
      'item_type',
      'owner_status',
      'program',
      'start_date',
      'type',
      'payment_methods',
      'short_description',
    ],
  },
};

export const IRA_INCENTIVES: IRAIncentive[] = JSON.parse(
  fs.readFileSync('./data/ira_incentives.json', 'utf-8'),
);
