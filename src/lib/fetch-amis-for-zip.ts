import { Database } from 'sqlite';
import {
  AMI,
  CountySubInfo,
  GeoInfo,
  IncomeInfo,
  MFI,
  PlaceInfo,
} from './income-info';

export default async function fetchAMIsForZip(
  db: Database,
  zip: string,
): Promise<IncomeInfo | null> {
  // Some ZIPs don't correspond to physical land areas. Usually these represent
  // a set of PO boxes, or a single high-volume postal customer. In these cases,
  // there is usually a "parent ZCTA" defined: a ZIP that does correspond to a
  // physical area, roughly where mail to the first ZIP is actually delivered.
  //
  // Such ZIPs don't contain residential addresses, so this shouldn't be an
  // issue for users who enter their actual residential ZIPs. Still, to avoid
  // confusion, use parent_zcta if it's non-blank.

  // city and county are approximate, as zips can span county/city lines.
  // We should communicate that clearly in API documentation and
  // in frontends.
  // https://app.asana.com/0/1204738794846444/1206454407609847
  // tracks longer-term work in this space.

  const location = await db.get<GeoInfo>(
    `
    SELECT 
        COALESCE(NULLIF(parent_zcta, ''), zip) as zip, 
        state_id, 
        city, 
        county_name as county
    FROM zips
    WHERE zip = ?
  `,
    zip,
  );
  if (!location) {
    return null;
  }

  // SUBSTRING is 1-indexed oh the horror
  const placeMatches = await db.all<PlaceInfo[]>(
    `
    SELECT 
        SUBSTRING(geoid_place_20, 1, 2) as state_fips, 
        namelsad_place_20 as name 
    FROM zcta_to_place
    WHERE geoid_zcta5_20 = ?
  `,
    location.zip, // actually ZCTA if available
  );
  const countySubMatches = await db.all<CountySubInfo[]>(
    `
    SELECT 
        SUBSTRING(geoid_cousub_20, 1, 2) as state_fips, 
        namelsad_cousub_20 as name 
    FROM zcta_to_countysub
    WHERE geoid_zcta5_20 = ?
  `,
    location.zip, // actually ZCTA if available
  );

  const stateFips: { [index: string]: string } = {
    '01': 'AL',
    '02': 'AK',
    '04': 'AZ',
    '05': 'AR',
    '06': 'CA',
    '08': 'CO',
    '09': 'CT',
    '10': 'DE',
    '11': 'DC',
    '12': 'FL',
    '13': 'GA',
    '15': 'HI',
    '16': 'ID',
    '17': 'IL',
    '18': 'IN',
    '19': 'IA',
    '20': 'KS',
    '21': 'KY',
    '22': 'LA',
    '23': 'ME',
    '24': 'MD',
    '25': 'MA',
    '26': 'MI',
    '27': 'MN',
    '28': 'MS',
    '29': 'MO',
    '30': 'MT',
    '31': 'NE',
    '32': 'NV',
    '33': 'NH',
    '34': 'NJ',
    '35': 'NM',
    '36': 'NY',
    '37': 'NC',
    '38': 'ND',
    '39': 'OH',
    '40': 'OK',
    '41': 'OR',
    '42': 'PA',
    '44': 'RI',
    '45': 'SC',
    '46': 'SD',
    '47': 'TN',
    '48': 'TX',
    '49': 'UT',
    '50': 'VT',
    '51': 'VA',
    '53': 'WA',
    '54': 'WV',
    '55': 'WI',
    '56': 'WY',
  };
  const places: PlaceInfo[] = [];

  placeMatches.forEach(match => {
    if (stateFips[match.state_fips] !== undefined)
      places.push({
        zcta: location.zip,
        state_fips: match.state_fips,
        state_id: stateFips[match.state_fips],
        name: match.name,
      });
  });

  const countysubs: CountySubInfo[] = [];
  countySubMatches.forEach(match => {
    if (stateFips[match.state_fips] !== undefined)
      countysubs.push({
        zcta: location.zip,
        state_fips: match.state_fips,
        state_id: stateFips[match.state_fips],
        name: match.name,
      });
  });

  const calculations = await db.get<MFI>(
    `
    SELECT
        MAX(is_urban) AS isUrban,
        MIN(t.mfi) AS lowestMFI,
        MAX(t.mfi) AS highestMFI,
        MIN(t.poverty_percent) AS lowestPovertyRate,
        MAX(t.poverty_percent) AS highestPovertyRate
    FROM zip_to_tract zt
        LEFT JOIN tracts t ON t.tract_geoid = zt.tract
    WHERE zt.zip = ? AND t.mfi != -666666666;
  `,
    location.zip,
  );

  const ami = await db.get<AMI>(
    `
    SELECT a.*
    FROM zip_to_cbsasub zc LEFT JOIN ami a ON a.cbsasub = zc.cbsasub
    WHERE zc.zipcode = ? AND a.cbsasub IS NOT NULL
  `,
    location.zip,
  );

  return { ami, location, calculations, places, countysubs };
}
