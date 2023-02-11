import Geocodio from 'geocodio-library-node';

const geocoder = new Geocodio(process.env.GEOCODIO_API_KEY);

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

  const calculations = await db.prepare(`
    SELECT
        is_urban AS isUrban,
        mfi AS lowestMFI,
        mfi AS highestMFI,
        poverty_percent AS lowestPovertyRate,
        poverty_percent AS highestPovertyRate
    FROM tracts t
    WHERE tract_geoid = ? AND mfi != -666666666;
  `).get(tractGeoid);

  const { lat, lng } = response?.results[0]?.location;
  const locationWkt = `POINT(${lng} ${lat})`;

  const ami = await db.prepare(`
    SELECT a.*
      FROM hud_fmr h
      LEFT JOIN ami a ON h.fy23_fmr_1 = a.cbsasub
    WHERE ST_WITHIN(GeomFromText(?, 4326), h.geometry)
      AND a.cbsasub IS NOT NULL;
  `).get(locationWkt);

  const location = {
    state_name: ami.state_name,
    state_id: ami.State_Alpha
  };

  return { location, calculations, ami };
}
