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
