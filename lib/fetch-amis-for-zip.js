export default async function fetchAMIsForZip(db, zip) {
  const location = await db.prepare(`SELECT * FROM zips WHERE zip = ?`).get(zip);
  if (!location) {
    return null;
  }
  const calculations = await db.prepare(`
    SELECT
        MAX(is_urban) AS isUrban,
        MIN(t.mfi) AS lowestMFI,
        MAX(t.mfi) AS highestMFI,
        MIN(t.poverty_percent) AS lowestPovertyRate,
        MAX(t.poverty_percent) AS highestPovertyRate
    FROM zip_to_tract zt
        LEFT JOIN tracts t ON t.tract_geoid = zt.tract
    WHERE zt.zip = ? AND t.mfi != -666666666;
  `).get(zip);
  const ami = await db.prepare(`
    SELECT a.*
    FROM zip_to_cbsasub zc LEFT JOIN ami a ON a.cbsasub = zc.cbsasub
    WHERE zc.zipcode = ? AND a.cbsasub IS NOT NULL
  `).get(zip);
  return { ami, location, calculations };
}
