import { Database } from 'sqlite';
import { AUTHORITIES_BY_STATE, Authority } from '../data/authorities';
import { isStateIncluded } from '../data/types/states';
import { GeoInfo } from './income-info';

/** Models the zip_to_utility table in sqlite. */
type ZipToUtility = {
  zip: string;
  utility_id: string;
  predominant: number;
};

/**
 * Find the utilities that may serve the given location. False positives are
 * not ideal but acceptable (i.e. returning a utility as an option for a
 * location they don't actually serve), whereas false negatives are a bug (i.e.
 * failing to return a utility for a location they do actually serve).
 *
 * Returns a map of utility IDs to utility info, suitable for the response
 * from /api/v1/utilities.
 */
export async function getUtilitiesForLocation(
  db: Database,
  location: GeoInfo,
  includeBeta: boolean,
): Promise<{
  [id: string]: Authority;
}> {
  const stateUtilities = AUTHORITIES_BY_STATE[location.state_id]?.utility;

  if (!stateUtilities || !isStateIncluded(location.state_id, includeBeta)) {
    return {};
  }

  // Put the predominant utility first
  const rows = await db.all<ZipToUtility[]>(
    'SELECT * FROM zip_to_utility WHERE zip = ? ORDER BY predominant DESC',
    location.zip,
  );

  // If we didn't find any utilities in the dataset, fall back to returning all
  // the utilities in the state.
  if (rows.length === 0) {
    return stateUtilities;
  }

  // For now, only return utilities that are also reflected in authorities.json,
  // as those are the ones we've done data collection for.
  return Object.fromEntries(
    rows
      .filter(row => row.utility_id in stateUtilities)
      .map(row => [row.utility_id, stateUtilities[row.utility_id]]),
  );
}
