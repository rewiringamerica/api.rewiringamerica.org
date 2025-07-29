import * as turf from '@turf/turf';
import { Census, FieldOption } from 'geocodio-library-node';
import { Database } from 'sqlite';
import { NO_GAS_UTILITY } from '../data/authorities';
import { InvalidInputError } from './error';
import { geocoder } from './geocoder';

export enum GeographyType {
  State = 'state',
  County = 'county',
  Custom = 'custom',
  ElectricTerritory = 'electric_territory',
  GasTerritory = 'gas_territory',
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

async function resolveUtility(
  db: Database,
  state: string,
  type: GeographyType.ElectricTerritory | GeographyType.GasTerritory,
  key: string,
): Promise<Geography> {
  const dbResult = await db.get<Geography>(
    `SELECT *, 1.0 as intersection_proportion
    FROM geographies
    WHERE key = ? and type = ? and state = ?`,
    key,
    type,
    state,
  );

  if (!dbResult) {
    throw new InvalidInputError(
      `Invalid utility "${key}".`,
      type === GeographyType.ElectricTerritory ? 'utility' : 'gas_utility',
    );
  }

  return dbResult;
}

export async function resolveLocation(
  db: Database,
  request: ({ zip: string } | { address: string }) & {
    utility?: string;
    gas_utility?: string;
  },
): Promise<ResolvedLocation | null> {
  const resolved: ResolvedLocation = { state: '', zcta: '', geographies: [] };

  if ('zip' in request) {
    const zcta = await getZctaFromZip(db, request.zip);
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

    resolved.state = stateGeo.state!;
    resolved.zcta = zcta;
    resolved.geographies.push(...geographies);
  } else {
    const { address } = request;
    let response;

    try {
      response = await geocoder.geocode(address, ['census2024' as FieldOption]);
    } catch (error) {
      console.error('Error geocoding user-inputted address: ', error);
      return null;
    }

    const result = response?.results?.at(0);

    // Accuracy type "state" is too imprecise
    if (
      !result ||
      result.address_components.country !== 'US' ||
      result.accuracy_type === 'state'
    ) {
      return null;
    }

    // The `census` field is mistyped in the geocodio library
    const censusYears = result.fields!.census as unknown as {
      [year: string]: Census;
    };
    const censusInfo = censusYears['2024'];

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

    resolved.state = result.address_components.state!;
    resolved.zcta =
      (await getZctaFromZip(db, result.address_components.zip!)) ??
      result.address_components.zip!;
    resolved.geographies.push(...geographies);
    resolved.tract_geoid = GEOCODIO_LOW_PRECISION.has(result.accuracy_type)
      ? undefined
      : censusInfo.county_fips + censusInfo.tract_code;
  }

  // Look up the geography records for the passed utilities
  if (request.utility) {
    resolved.geographies.unshift(
      await resolveUtility(
        db,
        resolved.state,
        GeographyType.ElectricTerritory,

        request.utility,
      ),
    );
  }
  if (request.gas_utility && request.gas_utility !== NO_GAS_UTILITY) {
    resolved.geographies.unshift(
      await resolveUtility(
        db,
        resolved.state,
        GeographyType.GasTerritory,
        request.gas_utility,
      ),
    );
  }

  return resolved;
}
