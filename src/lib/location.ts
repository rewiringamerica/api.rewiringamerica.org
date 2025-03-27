import { GeocodeAccuracyType } from 'geocodio-library-node';
import { Database } from 'sqlite';
import { geocoder } from './geocoder';

export type ResolvedLocation = {
  state: string;
  zcta: string;
  city: string;
  county_fips: string;
  tract_geoid?: string;
};

/**
 * Geocodio returns an "accuracy_type" value that indicates how granular of a
 * match it found. (Really it should be "precision", not "accuracy".) These
 * types are imprecise enough, in practice, that we can't trust the geocoded
 * census tract.
 */
// @ts-expect-error county is not included in the typedef
const GEOCODIO_LOW_PRECISION = new Set<GeocodeAccuracyType>([
  'street_center',
  'place',
  'county',
  'state',
]);

async function zipLookup(
  db: Database,
  zip: string,
): Promise<ResolvedLocation | undefined> {
  return await db.get<ResolvedLocation>(
    `SELECT
      COALESCE(NULLIF(parent_zcta, ''), zip) as zcta,
      state_id AS state,
      city,
      county_fips
    FROM zips
    WHERE zip = ?`,
    zip,
  );
}

export async function resolveLocation(
  db: Database,
  zipOrAddress: { zip: string } | { address: string },
): Promise<ResolvedLocation | null> {
  if ('zip' in zipOrAddress) {
    return (await zipLookup(db, zipOrAddress.zip)) ?? null;
  } else {
    const { address } = zipOrAddress;
    const response = await geocoder.geocode(address, ['census2020']);
    const result = response.results.at(0);

    if (!result || result.address_components.country !== 'US') {
      return null;
    }

    // @ts-expect-error census.2020 is not included in the typedef
    const censusInfo = result.fields.census['2020'];

    return {
      state: result.address_components.state!,
      zcta: result.address_components.zip!,
      // @ts-expect-error city is optional in the typedef
      city: result.address_components.city,
      county_fips: censusInfo.county_fips,
      tract_geoid: GEOCODIO_LOW_PRECISION.has(result.accuracy_type)
        ? undefined
        : censusInfo.county_fips + censusInfo.tract_code,
    };
  }
}
