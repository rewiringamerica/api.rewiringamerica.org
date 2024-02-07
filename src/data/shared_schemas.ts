import { JSONSchemaType } from 'ajv';
import { Amount, AmountType, AmountUnit } from './types/amount';

export const AMOUNT_SCHEMA: JSONSchemaType<Amount> = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: Object.values(AmountType) },
    number: { type: 'number' },
    unit: { type: 'string', enum: Object.values(AmountUnit), nullable: true },
    minimum: { type: 'number', nullable: true },
    maximum: { type: 'number', nullable: true },
    representative: { type: 'number', nullable: true },
  },
  required: ['type', 'number'],
  additionalProperties: false,
} as const;
