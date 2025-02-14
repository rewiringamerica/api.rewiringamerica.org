import { FromSchema } from 'json-schema-to-ts';

export const API_IMAGE_SCHEMA = {
  $id: 'APIImage.schema.json',
  type: 'object',
  properties: {
    src: {
      type: 'string',
      description: 'The URL to fetch the image from.',
    },
    width: {
      type: 'number',
      description: "The image's width in pixels.",
    },
    height: {
      type: 'number',
      description: "The image's height in pixels.",
    },
  },
  required: ['src', 'width', 'height'],
  additionalProperties: false,
} as const;

export type APIImage = FromSchema<typeof API_IMAGE_SCHEMA>;
