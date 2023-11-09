import { FromSchema } from 'json-schema-to-ts';

export const LOCALIZABLE_STRING_SCHEMA = {
  $id: 'LocalizableString',
  type: 'object',
  properties: {
    en: {
      type: 'string',
    },
    es: {
      type: 'string',
    },
    // Add more locales as needed
  },
  required: ['en'],
  additionalProperties: false,
} as const;

export type LocalizableString = FromSchema<typeof LOCALIZABLE_STRING_SCHEMA>;
