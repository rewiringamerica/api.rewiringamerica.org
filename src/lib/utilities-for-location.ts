import { AUTHORITIES_BY_STATE, Authority } from '../data/authorities';
import { InvalidInputError } from './error';
import { ZipInfo } from './income-info';

/**
 * Find the utilities that may serve the given location.
 *
 * Returns a map of utility IDs to utility info, suitable for the response
 * from /api/v1/utilities.
 *
 * TODO this is very not scalable to nationwide coverage!
 */
export function getUtilitiesForLocation(location: ZipInfo): {
  [id: string]: Authority;
} {
  const stateUtilities = AUTHORITIES_BY_STATE[location.state_id]?.utility;

  if (!stateUtilities) {
    throw new InvalidInputError(
      'We currently do not have coverage for that location',
      'location',
    );
  }

  let ids: string[];

  // Source: https://catalog.data.gov/dataset/u-s-electric-utility-companies-and-rates-look-up-by-zipcode-2021
  // According to that dataset, 02839 is not served by Pascoag, but in a meeting
  // with them they mentioned it, so it's included here.
  switch (location.zip) {
    case '02807':
      ids = ['ri-block-island-power-company'];
      break;
    case '02814':
    case '02830':
    case '02839':
    case '02859':
      ids = ['ri-rhode-island-energy', 'ri-pascoag-utility-district'];
      break;
    default:
      ids = ['ri-rhode-island-energy'];
  }

  return Object.fromEntries(ids.map(id => [id, stateUtilities[id]]));
}
