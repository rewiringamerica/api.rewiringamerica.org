import { FromSchema } from 'json-schema-to-ts';

export const API_IMAGE_SCHEMA = {
  type: 'object',
  properties: {
    src: {
      type: 'string',
    },
    width: {
      type: 'number',
    },
    height: {
      type: 'number',
    },
  },
  required: ['src', 'width', 'height'],
  additionalProperties: false,
} as const;

export type APIImage = FromSchema<typeof API_IMAGE_SCHEMA>;
