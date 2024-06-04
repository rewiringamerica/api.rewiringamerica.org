import { FromSchema } from 'json-schema-to-ts';

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
  description:
    'The computed location of the request\'s "zip" or "address" parameter.',
  properties: {
    state: {
      type: 'string',
      description: `The two-letter abbreviation for the state, district, or \
territory of the location submitted in the request.`,
    },
    city: {
      type: 'string',
      description:
        'The city name as determined by looking up the ZIP code in our database.',
    },
    county: {
      type: 'string',
      description:
        'The county name as determined by looking up the ZIP code in our database.',
    },
  },
  required: ['state'],
  additionalProperties: false,
} as const;

export type APIResponseLocation = FromSchema<
  typeof API_RESPONSE_LOCATION_SCHEMA
>;
