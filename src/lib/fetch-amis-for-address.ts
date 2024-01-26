import { Database } from 'sqlite';
import { geocoder } from './geocoder';
import { AMI, GeoInfo, IncomeInfo, MFI } from './income-info';

export default async function fetchAMIsForAddress(
  db: Database,
  address: string,
): Promise<IncomeInfo | null> {
  // TODO: confirm what era of tract data we have
  const response = await geocoder.geocode(address, ['census2010']);

  const result = response?.results?.at(0);

  if (!result) {
    return null;
  }

  const zip = result.address_components.zip;

  // We pull these from our database (vs geocoder) to ensure a match
  // when computing whether local incentives are eligible.
  // This data is approximate, as zips can span county/city lines.
  // We should communicate that clearly in API documentation and
  // in frontends.
  // https://app.asana.com/0/1204738794846444/1206454407609847
  // tracks longer-term work in this space.
  const supplemental = await db.get<GeoInfo>(
    `
    SELECT 
        city, 
        county_name as county
    FROM zips
    WHERE zip = ?
  `,
    zip,
  );

  const censusInfo = result.fields?.census['2010'];

  if (!censusInfo) {
    return null;
  }

  const tractGeoid = `${censusInfo.county_fips}${censusInfo.tract_code}`;

  const calculations = await db.get<MFI>(
    `
    SELECT
        is_urban AS isUrban,
        mfi AS lowestMFI,
        mfi AS highestMFI,
        poverty_percent AS lowestPovertyRate,
        poverty_percent AS highestPovertyRate
    FROM tracts t
    WHERE tract_geoid = ? AND mfi != -666666666;
  `,
    tractGeoid,
  );

  // FIXME: now that we have finer-grained geographic info we don't need to approximate with zips. Use Fair_Market_Rents etc.

  const location = {
    state_id: result.address_components.state,
    zip,
    city: supplemental?.city,
    county: supplemental?.county,
  };

  const ami = await db.get<AMI>(
    `
    SELECT a.*
    FROM zip_to_cbsasub zc LEFT JOIN ami a ON a.cbsasub = zc.cbsasub
    WHERE zc.zipcode = ? AND a.cbsasub IS NOT NULL
  `,
    zip,
  );

  return { ami, location, calculations };
}
