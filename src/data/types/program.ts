import { FromSchema } from 'json-schema-to-ts';
import { AuthorityType } from '../authorities';
import { ALL_ITEMS } from './items';
import { LOCALIZABLE_STRING_SCHEMA } from './localizable-string';

export const PROGRAM_SCHEMA = {
  $id: 'Program.schema.json',
  type: 'object',
  properties: {
    name: {
      $ref: 'LocalizableString',
    },
    url: {
      $ref: 'LocalizableString',
    },
    authority_type: { type: 'string', enum: Object.values(AuthorityType) },
    authority: { type: 'string', nullable: true },
    description: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'string',
        enum: ALL_ITEMS,
      },
    },
  },
  required: ['name', 'url', 'authority_type', 'authority'],
  additionalProperties: false,
} as const;

export const PROGRAMS_SCHEMA = {
  $id: 'Programs',
  title: 'Programs',
  type: 'object',
  patternProperties: {
    '^.*$': { $ref: 'Program.schema.json' },
  },
  additionalProperties: false,
} as const;

export type Program = FromSchema<
  typeof PROGRAM_SCHEMA,
  {
    references: [typeof LOCALIZABLE_STRING_SCHEMA];
  }
>;
