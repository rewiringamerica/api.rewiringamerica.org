import { Database } from 'sqlite';
import { APIAuthority, AUTHORITIES_BY_STATE } from '../data/authorities';
import { ResolvedLocation } from './location';

/** Models the zip_to_utility table in sqlite. */
type ZipToUtility = {
  zip: string;
  utility_id: string;
  predominant: number;
};

type AuthorityMap = {
  [id: string]: APIAuthority;
};

/**
 * Find the electric utilities that may serve the given location. False
 * positives are not ideal but acceptable (i.e. returning a utility as an option
 * for a location they don't actually serve), whereas false negatives are a bug
 * (i.e. failing to return a utility for a location they do actually serve).
 *
 * Returns a map of utility IDs to utility info, suitable for the response
 * from /api/v1/utilities.
 */
export async function getElectricUtilitiesForLocation(
  db: Database,
  location: ResolvedLocation,
): Promise<AuthorityMap> {
  return getUtilitiesForLocation(
    db,
    location,
    AUTHORITIES_BY_STATE[location.state]?.utility,
  );
}

/**
 * Find the gas utilities that may serve the given location.
 */
export async function getGasUtilitiesForLocation(
  db: Database,
  location: ResolvedLocation,
): Promise<AuthorityMap | undefined> {
  // TODO full logic to determine when gas utilities should be returned.
  const stateMap = AUTHORITIES_BY_STATE[location.state]?.gas_utility;
  if (stateMap && Object.keys(stateMap).length > 0) {
    return getUtilitiesForLocation(db, location, stateMap);
  } else {
    return undefined;
  }
}

async function getUtilitiesForLocation(
  db: Database,
  location: ResolvedLocation,
  stateUtilities: AuthorityMap | undefined,
): Promise<AuthorityMap> {
  if (!stateUtilities) {
    return {};
  }

  // Put the predominant utility first
  const rows = await db.all<ZipToUtility[]>(
    'SELECT * FROM zip_to_utility WHERE zip = ? ORDER BY predominant DESC',
    location.zcta,
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
