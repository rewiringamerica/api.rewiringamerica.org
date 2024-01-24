import { AUTHORITIES_BY_STATE, Authority } from '../data/authorities';
import { isStateIncluded } from '../data/types/states';
import { GeoInfo } from './income-info';

/**
 * Find the utilities that may serve the given location. False positives are
 * not ideal but acceptable (i.e. returning a utility as an option for a
 * location they don't actually serve), whereas false negatives are a bug (i.e.
 * failing to return a utility for a location they do actually serve).
 *
 * Returns a map of utility IDs to utility info, suitable for the response
 * from /api/v1/utilities.
 *
 * TODO this is very not scalable to nationwide coverage!
 */
export function getUtilitiesForLocation(
  location: GeoInfo,
  includeBeta: boolean,
): {
  [id: string]: Authority;
} {
  const stateUtilities = AUTHORITIES_BY_STATE[location.state_id]?.utility;

  if (!stateUtilities || !isStateIncluded(location.state_id, includeBeta)) {
    return {};
  }

  let ids: string[];

  // If we know details about where the state's utilities operate, we can
  // encode that here.
  if (location.state_id === 'RI') {
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
  } else {
    // Fall back to returning all the state's utilities, regardless of location.
    return stateUtilities;
  }

  return Object.fromEntries(ids.map(id => [id, stateUtilities[id]]));
}
