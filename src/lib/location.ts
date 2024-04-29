import { Database } from 'sqlite';
import { geocoder } from './geocoder';

export type ResolvedLocation = {
  state: string;
  zcta: string;
  city: string;
  county: string;
  tractGeoid?: string;
};

/**
 * Geocodio returns an "accuracy_type" value that indicates how granular of a
 * match it found. (Really it should be "precision", not "accuracy".) These
 * types are imprecise enough, in practice, that we can't trust the geocoded
 * census tract.
 */
const GEOCODIO_LOW_PRECISION = new Set([
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
      county_name AS county
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
    const result = response?.results?.at(0);

    if (!result || result.address_components.country !== 'US') {
      return null;
    }

    const censusInfo = GEOCODIO_LOW_PRECISION.has(result.accuracy_type)
      ? null
      : result.fields.census['2020'];

    return {
      state: result.address_components.state,
      zcta:
        (await zipLookup(db, result.address_components.zip))?.zcta ??
        result.address_components.zip,
      city: result.address_components.city,
      // TODO these look like "Blah County" or "Blah Parish" etc. However,
      // county authorities are defined without those suffixes, and that's how
      // county-level incentives are matched against location lookups. The
      // solution will be to switch to defining authorities with county FIPS
      // codes instead. Using the suffixed names here is OK for the immediate
      // term since the calculator does not use the "address" param and thus
      // won't use this code path.
      county: result.address_components.county,
      tractGeoid: censusInfo
        ? censusInfo.county_fips + censusInfo.tract_code
        : undefined,
    };
  }
}
