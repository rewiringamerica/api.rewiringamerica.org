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
    description: { type: 'string' },
  },
  required: ['name', 'url'],
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
