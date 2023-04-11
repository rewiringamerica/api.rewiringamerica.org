export default async function fetchAMIsForZip(db, zip) {
  const location = await db.get(`
    SELECT * FROM zips WHERE zip = ?
  `, zip);
  if (!location) {
    return null;
  }

  const calculations = await db.get(`
    SELECT
        MAX(is_urban) AS isUrban,
        MIN(t.mfi) AS lowestMFI,
        MAX(t.mfi) AS highestMFI,
        MIN(t.poverty_percent) AS lowestPovertyRate,
        MAX(t.poverty_percent) AS highestPovertyRate
    FROM zip_to_tract zt
        LEFT JOIN tracts t ON t.tract_geoid = zt.tract
    WHERE zt.zip = ? AND t.mfi != -666666666;
  `, zip);

  const ami = await db.get(`
    SELECT a.*
    FROM zip_to_cbsasub zc LEFT JOIN ami a ON a.cbsasub = zc.cbsasub
    WHERE zc.zipcode = ? AND a.cbsasub IS NOT NULL
  `, zip);

  return { ami, location, calculations };
}
