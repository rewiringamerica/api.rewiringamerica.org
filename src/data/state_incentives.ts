import { JSONSchemaType } from 'ajv';
import fs from 'fs';
import _ from 'lodash';
import { AuthorityType } from './authorities';
import {
  COLowIncomeAuthority,
  ILIncomeAuthority,
  NVLowIncomeAuthority,
  RILowIncomeAuthority,
} from './low_income_thresholds';
import { PROGRAMS } from './programs';
import { FilingStatus } from './tax_brackets';
import { AMOUNT_SCHEMA } from './types/amount';

import { START_END_DATE_REGEX } from '../lib/dates';
import { Amount } from './types/amount';
import { IncentiveStatus } from './types/incentive-status';
import { PaymentMethod } from './types/incentive-types';
import { ALL_ITEMS, Item } from './types/items';
import { LocalizableString } from './types/localizable-string';
import { OwnerStatus } from './types/owner-status';

export type LowIncomeAuthority =
  | 'default'
  | COLowIncomeAuthority
  | ILIncomeAuthority
  | NVLowIncomeAuthority
  | RILowIncomeAuthority;

// CollectedIncentive and its JSON schema represent the data that lives in raw
// collected form, e.g. spreadsheets. It should match column-for-column to our
// spreadsheet format aside from nested fields like amount and column
// renames/aliases.
export type CollectedIncentive = {
  id: string;
  data_urls?: string[];
  authority_type: AuthorityType;
  authority_name: string;
  geo_eligibility?: string;
  program_title: string;
  program_url: string;
  items: Item[];
  item_if_selected_other?: string;
  short_description: LocalizableString;
  status?: string;
  start_date?: string;
  end_date?: string;
  payment_methods: PaymentMethod[];
  rebate_value: string;
  amount: Amount;
  bonus_description?: string;
  equipment_standards_restrictions?: string;
  equipment_capacity_restrictions?: string;
  contractor_restrictions?: string;
  income_restrictions?: string;
  filing_status?: FilingStatus;
  owner_status: OwnerStatus[];
  other_restrictions?: string;
  stacking_details?: string;
  financing_details?: string;
  editorial_notes?: string;
  questions?: string;
  omit_from_api?: boolean;
};

const collectedIncentivePropertySchema = {
  id: { type: 'string' },
  data_urls: {
    type: 'array',
    items: { type: 'string' },
    nullable: true,
  },
  authority_type: { type: 'string', enum: Object.values(AuthorityType) },
  authority_name: { type: 'string' },
  geo_eligibility: { type: 'string', nullable: true },
  program_title: { type: 'string' },
  program_url: { type: 'string' },
  items: {
    type: 'array',
    items: { type: 'string', enum: ALL_ITEMS },
  },
  item_if_selected_other: { type: 'string', nullable: true },
  short_description: { $ref: 'LocalizableString' },
  status: {
    type: 'string',
    enum: Object.values(IncentiveStatus),
    nullable: true,
  },
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
  rebate_value: { type: 'string' },
  amount: AMOUNT_SCHEMA,
  bonus_description: { type: 'string', nullable: true },
  equipment_standards_restrictions: { type: 'string', nullable: true },
  equipment_capacity_restrictions: { type: 'string', nullable: true },
  contractor_restrictions: { type: 'string', nullable: true },
  income_restrictions: { type: 'string', nullable: true },
  filing_status: {
    type: 'string',
    enum: Object.values(FilingStatus),
    nullable: true,
  },
  owner_status: {
    type: 'array',
    items: { type: 'string', enum: Object.values(OwnerStatus) },
    minItems: 1,
  },
  other_restrictions: { type: 'string', nullable: true },
  stacking_details: { type: 'string', nullable: true },
  financing_details: { type: 'string', nullable: true },
  editorial_notes: { type: 'string', nullable: true },
  questions: { type: 'string', nullable: true },
  omit_from_api: { type: 'boolean', nullable: true },
} as const;
const requiredCollectedFields = [
  'id',
  //'data_urls',
  'authority_type',
  'authority_name',
  'program_title',
  'program_url',
  'items',
  'short_description',
  //'program_status',
  'payment_methods',
  'rebate_value',
  'amount',
  'owner_status',
] as const;

// DerivedFields and its schema are associated with data not directly collected
// in the main spreadsheets. They may have a close relationship with collected
// fields. Generally, if what's in the spreadsheet requires more than just
// fitting to an enum or converting from string to number with minor cleanup,
// it should have a separate collected and derived version.
export type DerivedFields = {
  eligible_geo_group?: string;
  program: string;
  bonus_available?: boolean;
  low_income?: LowIncomeAuthority;
  more_info_url?: LocalizableString;
};

const derivedIncentivePropertySchema = {
  eligible_geo_group: { type: 'string', nullable: true },
  program: { type: 'string', enum: Object.keys(PROGRAMS) },
  bonus_available: { type: 'boolean', nullable: true },
  low_income: { type: 'string', nullable: true },
  more_info_url: {
    $ref: 'LocalizableString',
  },
} as const;

// Collected fields that pass-through directly to our StateIncentives schema
// without any modification or processing.
export const PASS_THROUGH_FIELDS = [
  'id',
  'payment_methods',
  'items',
  'start_date',
  'end_date',
  'amount',
  'owner_status',
  'short_description',
  'data_urls',
  'status',
  'equipment_standards_restrictions',
  'equipment_capacity_restrictions',
  'contractor_restrictions',
  'other_restrictions',
  'stacking_details',
  'financing_details',
  'editorial_notes',
] as const;
type PassThroughField = (typeof PASS_THROUGH_FIELDS)[number];

const passThroughCollectedProperties = _.pick(
  collectedIncentivePropertySchema,
  PASS_THROUGH_FIELDS,
);

export type StateIncentive = Pick<CollectedIncentive, PassThroughField> &
  DerivedFields;

export type StateIncentivesMap = {
  [stateId: string]: StateIncentive[];
};

const incentivePropertySchema = {
  ...passThroughCollectedProperties,
  ...derivedIncentivePropertySchema,
};

// We specify field order which helps when debugging records.
// This type forces all top-level fields to appear.
const fieldOrder: {
  [Key in keyof typeof incentivePropertySchema]: undefined;
} = {
  id: undefined,
  eligible_geo_group: undefined,
  payment_methods: undefined,
  items: undefined,
  program: undefined,
  amount: undefined,
  owner_status: undefined,
  short_description: undefined,
  status: undefined,
  start_date: undefined,
  end_date: undefined,
  bonus_available: undefined,
  low_income: undefined,
  more_info_url: undefined,
  data_urls: undefined,
  equipment_standards_restrictions: undefined,
  equipment_capacity_restrictions: undefined,
  contractor_restrictions: undefined,
  other_restrictions: undefined,
  stacking_details: undefined,
  financing_details: undefined,
  editorial_notes: undefined,
} as const;
export const FIELD_ORDER = Object.keys(fieldOrder);

const requiredProperties = [
  'id',
  'payment_methods',
  'items',
  'program',
  'amount',
  'owner_status',
  'short_description',
] as const;

export const COLLECTED_DATA_SCHEMA: JSONSchemaType<CollectedIncentive> = {
  type: 'object',
  properties: {
    ...collectedIncentivePropertySchema,
  },
  required: requiredCollectedFields,
} as const;

export const STATE_SCHEMA: JSONSchemaType<StateIncentive> = {
  type: 'object',
  properties: {
    ...incentivePropertySchema,
  },
  required: requiredProperties,
  additionalProperties: false,
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
    additionalProperties: false,
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
    additionalProperties: false,
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

export const DC_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      ...incentivePropertySchema,
    },
    required: requiredProperties,
  },
} as const;

export const DC_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/DC/incentives.json', 'utf-8'),
);

export const GA_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
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

export const GA_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/GA/incentives.json', 'utf-8'),
);

export const IL_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
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

export const IL_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/IL/incentives.json', 'utf-8'),
);

export const ME_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
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

export const ME_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/ME/incentives.json', 'utf-8'),
);

export const MI_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
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

export const MI_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/MI/incentives.json', 'utf-8'),
);

export const NV_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
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

export const NV_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/NV/incentives.json', 'utf-8'),
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

export const PA_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
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

export const PA_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/PA/incentives.json', 'utf-8'),
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

export const OR_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
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

export const OR_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/OR/incentives.json', 'utf-8'),
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

export const WI_INCENTIVES_SCHEMA: JSONSchemaType<StateIncentive[]> = {
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

export const WI_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/WI/incentives.json', 'utf-8'),
);

export const STATE_INCENTIVES_BY_STATE: StateIncentivesMap = {
  AZ: AZ_INCENTIVES,
  CO: CO_INCENTIVES,
  CT: CT_INCENTIVES,
  DC: DC_INCENTIVES,
  GA: GA_INCENTIVES,
  IL: IL_INCENTIVES,
  ME: ME_INCENTIVES,
  MI: MI_INCENTIVES,
  NV: NV_INCENTIVES,
  NY: NY_INCENTIVES,
  OR: OR_INCENTIVES,
  PA: PA_INCENTIVES,
  RI: RI_INCENTIVES,
  VA: VA_INCENTIVES,
  VT: VT_INCENTIVES,
  WI: WI_INCENTIVES,
};
