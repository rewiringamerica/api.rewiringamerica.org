import { Database } from 'better-sqlite3';
import _ from 'lodash';
import { APIAuthority, AuthorityType } from '../data/authorities';
import { GEO_GROUPS_BY_STATE } from '../data/geo_groups';
import { PROGRAMS } from '../data/programs';
import { STATE_INCENTIVES_BY_STATE } from '../data/state_incentives';
import { GeographyType, ResolvedLocation } from './location';

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
  return getUtilitiesForLocation(db, location, GeographyType.ElectricTerritory);
}

/**
 * Find the gas utilities that may serve the given location. Returns undefined
 * if and only if we don't have the data.
 */
export async function getGasUtilitiesForLocation(
  db: Database,
  location: ResolvedLocation,
): Promise<AuthorityMap | undefined> {
  // Every state has at least one gas utility in real life, so if we know of no
  // gas territories in the state, take that to mean we don't have the data.
  const totalInState = db
    .prepare<string, { ct: number }>(
      `SELECT count(1) AS ct FROM geographies
    WHERE state = ? AND type = 'gas_territory'`,
    )
    .get(location.state)!.ct;

  if (totalInState === 0) {
    return undefined;
  }

  return getUtilitiesForLocation(db, location, GeographyType.GasTerritory);
}

/**
 * Whether someone's gas utility can affect the set of incentives they're
 * eligible for, in the given location. This can be because there are gas
 * utilities that offer incentives we track, or because there's some more
 * complex eligibility rule at play (i.e. Mass Save).
 */
export function canGasUtilityAffectEligibility(
  location: ResolvedLocation,
): boolean {
  // Mass Save
  if (location.state === 'MA') {
    return true;
  }

  if (location.state in STATE_INCENTIVES_BY_STATE) {
    // Find whether the state has any gas utility incentives
    return !!STATE_INCENTIVES_BY_STATE[location.state].find(
      incentive =>
        // Directly from a gas utility
        PROGRAMS[incentive.program].authority_type ===
          AuthorityType.GasUtility ||
        // Via a geo group
        (incentive.eligible_geo_group &&
          'gas_utilities' in
            GEO_GROUPS_BY_STATE[location.state][incentive.eligible_geo_group]),
    );
  }

  return false;
}

async function getUtilitiesForLocation(
  db: Database,
  location: ResolvedLocation,
  type: GeographyType,
): Promise<AuthorityMap> {
  // Search the mappings of zips that have this location's ZCTA as the parent.
  // Put the predominant utility first.
  const rows = db
    .prepare<
      { zcta: string; type: string; state: string },
      { key: string; name: string }
    >(
      `
    WITH child_zips AS (
      SELECT zip FROM zips WHERE parent_zcta = @zcta
    )
    SELECT g.key, g.name FROM zip_to_geography_approx zg
    JOIN geographies g ON (g.id = zg.geography_id)
    WHERE (zip = @zcta OR zip IN child_zips)
    AND g.type = @type
    AND g.state = @state
    ORDER BY predominant DESC
    `,
    )
    .all({ zcta: location.zcta, type: type, state: location.state });

  return Object.fromEntries(rows.map(row => [row.key, _.pick(row, 'name')]));
}
