import * as turf from '@turf/turf';
import { Database } from 'sqlite';
import { geocoder } from './geocoder';

export enum GeographyType {
  State = 'state',
  County = 'county',
  Custom = 'custom',
}

type DbGeography = {
  id: number;
  type: GeographyType;
  name: string;
  state: string | null;
  county_fips: string | null;
  geometry: string | null;
};

export type Geography = Omit<DbGeography, 'geometry'> & {
  intersection_proportion: number;
};

export type ResolvedLocation = {
  /**
   * Which state/territory the user is considered to be in. Note that some ZCTAs
   * cross state lines; in these cases, this field contains the state that has
   * the greatest land area of overlap with the ZCTA.
   */
  state: string;

  zcta: string;

  /**
   * All geographies that may overlap with the user's location. If the user
   * submitted a zip code, there may be multiple geographies of each type. If
   * they submitted an address, there will be one state, one county, and at most
   * one custom.
   */
  geographies: Geography[];

  tract_geoid?: string;
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

async function getZctaFromZip(
  db: Database,
  zip: string,
): Promise<string | undefined> {
  const row = await db.get<{ zcta: string } | undefined>(
    `SELECT
      CASE WHEN zcta = 'TRUE' THEN zip
      ELSE NULLIF(parent_zcta, '')
      END
      AS zcta
    FROM zips
    WHERE zip = ?`,
    zip,
  );
  return row?.zcta;
}

export async function resolveLocation(
  db: Database,
  zipOrAddress: { zip: string } | { address: string },
): Promise<ResolvedLocation | null> {
  if ('zip' in zipOrAddress) {
    const zcta = await getZctaFromZip(db, zipOrAddress.zip);
    if (!zcta) {
      return null;
    }

    const geographies = await db.all<Geography[]>(
      `SELECT g.*, zg.intersection_proportion
      FROM geographies g
      JOIN zcta_to_geography zg ON g.id = zg.geography_id
      WHERE zcta = ?
      ORDER BY intersection_proportion DESC`,
      zcta,
    );

    // For ZCTAs that intersect multiple states, for now just pick the state
    // with the largest overlap, rather than show incentives for multiple
    // states. (`geographies` is in descending order of overlap area.)
    const stateGeo = geographies.find(g => g.type === GeographyType.State);

    if (!stateGeo) {
      return null;
    }

    return {
      state: stateGeo.state!,
      zcta,
      geographies,
    };
  } else {
    const { address } = zipOrAddress;
    const response = await geocoder.geocode(address, ['census2024']);
    const result = response?.results?.at(0);

    if (!result || result.address_components.country !== 'US') {
      return null;
    }

    const censusInfo = result.fields.census['2024'];

    const geographies: Geography[] = [];

    const state = await db.get<DbGeography>(
      `SELECT * FROM geographies
      WHERE type = 'state' AND state = ?`,
      result.address_components.state,
    );
    if (state) {
      geographies.push({ ...state, intersection_proportion: 1.0 });
    }

    const county = await db.get<DbGeography>(
      `SELECT * FROM geographies
      WHERE type = 'county' AND county_fips = ?`,
      censusInfo.county_fips,
    );
    if (county) {
      geographies.push({ ...county, intersection_proportion: 1.0 });
    }

    const point = turf.point([result.location.lng, result.location.lat]);

    // There is a relatively small number of 'custom' geographies, so running
    // the "contains" computation over all of them is quick. If necessary, we
    // can speed this up by using a spatial index and/or caching the parsed
    // GeoJSON in memory.
    (
      await db.all<DbGeography[]>(
        `SELECT * FROM geographies WHERE type = 'custom'`,
      )
    )
      .filter(geo => {
        const geometry = JSON.parse(geo.geometry!);
        let contains = false;

        // Check whether the point is inside any sub-geometry of the overall
        // geometry object (which is usually a FeatureCollection).
        turf.geomEach(geometry, subgeometry => {
          if (turf.booleanPointInPolygon(point, subgeometry)) {
            contains = true;
            // Returning false from the geomEach callback terminates the
            // geomEach loop early.
            return false;
          }
        });
        return contains;
      })
      .forEach(geo =>
        geographies.push({ ...geo, intersection_proportion: 1.0 }),
      );

    return {
      state: result.address_components.state,
      zcta:
        (await getZctaFromZip(db, result.address_components.zip)) ??
        result.address_components.zip,
      geographies,
      tract_geoid: GEOCODIO_LOW_PRECISION.has(result.accuracy_type)
        ? undefined
        : censusInfo.county_fips + censusInfo.tract_code,
    };
  }
}
