import fs from 'fs';
import { JSONSchemaType } from 'ajv';
import { FilingStatus } from './tax_brackets';
import { ALL_ITEMS, Item } from './items';

export enum AmiQualification {
  LessThan150_Ami = 'less_than_150_ami',
  LessThan80_Ami = 'less_than_80_ami',
  MoreThan80_Ami = 'more_than_80_ami',
}

export enum AmountType {
  DollarAmount = 'dollar_amount',
  Percent = 'percent',
  PerUnit = 'dollars_per_unit',
}

export enum AmountUnit {
  Ton = 'ton',
  Watt = 'watt',
}

/**
 * There are four types of amount, with the following rules:
 *
 * - dollar_amount. This must specify "number" as the exact or maximum number
 *   of dollars the incentive is for. Must not have "unit" or "representative".
 *
 *   TODO some also specify "maximum". For now this is just a marker that there
 *   is more to the incentive; it may be tiered flat amounts depending on
 *   equipment specs or some input we're not capturing, or something more
 *   complex.
 *
 * - percent. Number is between 0 and 1. May also have "maximum" and
 *   "representative". Must not have "unit".
 *
 * - dollars_per_unit. Number is dollars per unit. "unit" is required. May also
 *   have "maximum" and "representative".
 */
export interface Amount {
  type: AmountType;
  number: number;
  unit?: AmountUnit;
  maximum?: number;
  representative?: number;
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
  amount: Amount;
  end_date: number;
  filing_status: FilingStatus | null;
  item: Item;
  item_type: ItemType;
  owner_status: OwnerStatus[];
  program: string;
  start_date: number;
  type: Type;
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
      type: { type: 'string', enum: Object.values(Type) },
      program: { type: 'string' },
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
