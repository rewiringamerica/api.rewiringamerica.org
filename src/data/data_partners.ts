import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';
import { API_IMAGE_SCHEMA } from '../schemas/v1/image';
import { STATES_AND_TERRITORIES } from './types/states';

/**
 * A data partner is a partner organization that has helped gather
 * and review the state's incentive data, but they don't offer incentives
 * directly. We include them to give them credit for their work and to demonstrate
 * their endorsement of the incentives calculator.
 *
 * Some organizations are both data partners who have helped gather incentives
 * and authorities that offer incentives. These organizations should
 * represented as authorities in the code.
 */

export const API_DATA_PARTNER_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    logo: API_IMAGE_SCHEMA,
  },
  required: ['name'],
  additionalProperties: false,
} as const;

const dataPartnerMapSchema = {
  type: 'object',
  additionalProperties: API_DATA_PARTNER_SCHEMA,
  required: [],
} as const;

export type DataPartnersType = FromSchema<typeof dataPartnerMapSchema>;

export const SCHEMA = {
  type: 'object',
  propertyNames: {
    type: 'string',
    enum: STATES_AND_TERRITORIES,
  },
  additionalProperties: dataPartnerMapSchema,
  required: [],
} as const;

export type DataPartnersByState = FromSchema<typeof SCHEMA>;

export const DATA_PARTNERS_BY_STATE: DataPartnersByState = JSON.parse(
  fs.readFileSync('./data/data_partners.json', 'utf-8'),
);
