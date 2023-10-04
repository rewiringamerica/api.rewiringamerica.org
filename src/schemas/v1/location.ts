import { FromSchema } from 'json-schema-to-ts';

/**
 * The format of the location given to us by the calculator user. It can be
 * either a ZIP code, or an address string that we pass to Geocodio.
 */
export const API_REQUEST_LOCATION_SCHEMA = {
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

/**
 * During incentive calculation, we compute some information about the user's
 * location (as given in the request). This structure lets us reflect some of
 * that in the response.
 *
 * We can add to this as necessary. Eventually we'll need city or county, and
 * maybe even census tracts.
 */
export const API_RESPONSE_LOCATION_SCHEMA = {
  type: 'object',
  properties: {
    state: {
      type: 'string',
      description:
        'The two-letter abbreviation for the state, district, or territory of the location submitted in the request.',
    },
  },
  required: ['state'],
  additionalProperties: false,
} as const;

export type APIRequestLocation = FromSchema<typeof API_REQUEST_LOCATION_SCHEMA>;
export type APIResponseLocation = FromSchema<
  typeof API_RESPONSE_LOCATION_SCHEMA
>;
