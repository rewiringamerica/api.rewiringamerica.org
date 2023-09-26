import { FromSchema } from 'json-schema-to-ts';

export const API_COVERAGE_SCHEMA = {
  description:
    'Which sub-national sets of incentives were considered for eligibility.',
  type: 'object',
  properties: {
    state: {
      type: 'string',
      nullable: true,
      description:
        'Two-letter state code. Determined from the "location" request parameter.',
    },
    utility: {
      type: 'string',
      nullable: true,
      description: 'Utility ID, as passed in the "utility" request parameter.',
    },
  },
  required: ['state', 'utility'],
  additionalProperties: false,
} as const;

export type APICoverage = FromSchema<typeof API_COVERAGE_SCHEMA>;
