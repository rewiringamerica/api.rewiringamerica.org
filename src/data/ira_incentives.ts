import { JSONSchemaType } from 'ajv';
import fs from 'fs';
import { START_END_DATE_REGEX } from '../lib/dates';
import { AuthorityType } from './authorities';
import { PROGRAMS } from './programs';
import { FilingStatus } from './tax_brackets';
import { AMOUNT_SCHEMA, Amount } from './types/amount';
import { PaymentMethod } from './types/incentive-types';
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
  agi_max_limit?: number;
  ami_qualification: AmiQualification | null;
  amount: Amount;
  authority_type: AuthorityType.Federal;
  end_date: string;
  filing_status?: FilingStatus;
  item: Item;
  owner_status: OwnerStatus[];
  program: string;
  start_date: string;
  type:
    | PaymentMethod.PosRebate
    | PaymentMethod.TaxCredit
    | PaymentMethod.PerformanceRebate;
  payment_methods: PaymentMethod[];
  short_description: LocalizableString;
  more_info_url: LocalizableString;
}

// Work around https://github.com/ajv-validator/ajv/issues/1664
// This adds { type: 'null' } to a sub-schema but hides it from TSC.
// The test-time validation logic will accept null as a valid value.
const nullable = <T>(input: T): T => {
  return { anyOf: [input, { type: 'null' }] } as T;
};

export const SCHEMA: JSONSchemaType<IRAIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: {
        type: 'string',
        enum: [
          PaymentMethod.PosRebate,
          PaymentMethod.TaxCredit,
          PaymentMethod.PerformanceRebate,
        ],
      },
      payment_methods: {
        type: 'array',
        items: { type: 'string', enum: Object.values(PaymentMethod) },
      },
      program: { type: 'string', enum: Object.keys(PROGRAMS) },
      authority_type: { type: 'string', const: AuthorityType.Federal },
      item: { type: 'string', enum: ALL_ITEMS },
      amount: AMOUNT_SCHEMA,
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
      agi_max_limit: { type: 'integer', nullable: true },
      filing_status: {
        type: 'string',
        enum: Object.values(FilingStatus),
        nullable: true,
      },
      start_date: {
        type: 'string',
        pattern: START_END_DATE_REGEX.source,
      },
      end_date: {
        type: 'string',
        pattern: START_END_DATE_REGEX.source,
      },
      short_description: {
        $ref: 'LocalizableString',
      },
      more_info_url: {
        $ref: 'LocalizableString',
      },
    },
    required: [
      'id',
      'ami_qualification',
      'amount',
      'authority_type',
      'end_date',
      'item',
      'owner_status',
      'program',
      'start_date',
      'type',
      'payment_methods',
      'short_description',
    ],
    additionalProperties: false,
  },
};

export const IRA_INCENTIVES: IRAIncentive[] = JSON.parse(
  fs.readFileSync('./data/ira_incentives.json', 'utf-8'),
);
