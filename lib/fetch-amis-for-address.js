import { geocoder } from './geocoder.js';

export default async function fetchAMIsForAddress(db, address) {

  // TODO: confirm what era of tract data we have
  const response = await geocoder.geocode(address, ['census2010'])

  const result = response?.results?.at(0);

  if (!result) {
    return null;
  }

  const zip = result.address_components.zip;

  const censusInfo = result.fields?.census['2010'];

  if (!censusInfo) {
    return null;
  }

  const tractGeoid = `${censusInfo.county_fips}${censusInfo.tract_code}`;

  const calculations = await db.get(`
    SELECT
        is_urban AS isUrban,
        mfi AS lowestMFI,
        mfi AS highestMFI,
        poverty_percent AS lowestPovertyRate,
        poverty_percent AS highestPovertyRate
    FROM tracts t
    WHERE tract_geoid = ? AND mfi != -666666666;
  `, tractGeoid);

  // FIXME: now that we have finer-grained geographic info we don't need to approximate with zips. Use Fair_Market_Rents etc.

  const location = await db.get(`
    SELECT * FROM zips WHERE zip = ?
  `, zip);

  const ami = await db.get(`
    SELECT a.*
    FROM zip_to_cbsasub zc LEFT JOIN ami a ON a.cbsasub = zc.cbsasub
    WHERE zc.zipcode = ? AND a.cbsasub IS NOT NULL
  `, zip);

  // https://docs.google.com/spreadsheets/d/176ou5N6WKdOkWWM1rjWFpHCqK0jCARc7/edit#gid=1822730910
  const { isNmtc } = await db.get(`
    SELECT
      tract_geoid IS NOT NULL as isNmtc
    FROM nmtc_tracts WHERE tract_geoid = ?
  `, tractGeoid);

  // const { isAiannh } = await db.get(`
  //   SELECT
  //     aiannh IS NOT NULL as isAiannh
  //   FROM block_to_aiannh WHERE geoid = ?
  // `, censusInfo.full_fips);

  const geographicQualifiers = [];
  if (isNmtc) {
    geographicQualifiers.push('nmtc_census_tract');
  }
  // if (isAiannh) {
  //   geographicQualifiers.push('aiannh')
  // }

  return { ami, location, calculations, geographicQualifiers };
}
