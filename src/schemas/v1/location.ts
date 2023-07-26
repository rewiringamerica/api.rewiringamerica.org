import { FromSchema } from 'json-schema-to-ts';

export const API_LOCATION_SCHEMA = {
  type: 'object',
  properties: {
    zip: {
      type: 'string',
      description:
        'Your zip code helps us estimate the amount of discounts and tax credits you qualify for by finding representative census tracts in your area.',
      maxLength: 5,
      minLength: 5,
      examples: [
        '80212',
      ],
    },
    address: {
      type: 'string',
      description:
        "Your address can determine the precise census tract you're in that determines the correct amount of discounts and tax credits you qualify for.",
      examples: [
        '1109 N Highland St, Arlington VA',
      ],
    },
  },
  oneOf: [
    {
      required: [
        'zip',
      ],
    },
    {
      required: [
        'address',
      ],
    },
  ],
  maxProperties: 1,
  minProperties: 1,
} as const;

export type APILocation = FromSchema<typeof API_LOCATION_SCHEMA>;
