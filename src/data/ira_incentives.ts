import fs from 'fs';
import { JSONSchemaType } from 'ajv';
import { FilingStatus } from './tax_brackets.js';
import { ALL_ITEMS } from './items.js';

export enum AmiQualification {
  LessThan150_Ami = 'less_than_150_ami',
  LessThan80_Ami = 'less_than_80_ami',
  MoreThan80_Ami = 'more_than_80_ami',
}

export enum AmountType {
  DollarAmount = 'dollar_amount',
  Percent = 'percent',
}

export enum ItemType {
  EvChargerCredit = 'ev_charger_credit',
  PerformanceRebate = 'performance_rebate',
  PosRebate = 'pos_rebate',
  SolarTaxCredit = 'solar_tax_credit',
  TaxCredit = 'tax_credit',
}

export enum Type {
  PosRebate = 'pos_rebate',
  TaxCredit = 'tax_credit',
}

export enum OwnerStatus {
  Homeowner = 'homeowner',
  Renter = 'renter',
}

export interface Incentive {
  agi_max_limit: number | null;
  ami_qualification: AmiQualification | null;
  amount: number;
  amount_type: AmountType;
  end_date: number;
  filing_status: FilingStatus | null;
  item: string;
  item_type: ItemType;
  owner_status: OwnerStatus[];
  program: string;
  representative_amount: number | null;
  start_date: number;
  type: Type;
}

// Work around https://github.com/ajv-validator/ajv/issues/1664
// This adds { type: 'null' } to a sub-schema but hides it from TSC.
// The test-time validation logic will accept null as a valid value.
const nullable = <T>(input: T): T => {
  return { anyOf: [input, { type: 'null' }] } as T;
};

export const SCHEMA: JSONSchemaType<Incentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: Object.values(Type) },
      program: { type: 'string' },
      item: { type: 'string', enum: ALL_ITEMS },
      item_type: { type: 'string', enum: Object.values(ItemType) },
      amount: { type: 'number' },
      amount_type: { type: 'string', enum: Object.values(AmountType) },
      representative_amount: nullable({ type: 'number' }),
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
    },
    required: [
      'agi_max_limit',
      'ami_qualification',
      'amount',
      'amount_type',
      'end_date',
      'filing_status',
      'item',
      'item_type',
      'owner_status',
      'program',
      'representative_amount',
      'start_date',
      'type',
    ],
  },
};

export const IRA_INCENTIVES: Incentive[] = JSON.parse(
  fs.readFileSync('./data/ira_incentives.json', 'utf-8'),
);
