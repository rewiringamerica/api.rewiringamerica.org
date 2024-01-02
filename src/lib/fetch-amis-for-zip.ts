import { Database } from 'sqlite';
import { AMI, IncomeInfo, MFI, ZipInfo } from './income-info';

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
  const location = await db.get<ZipInfo>(
    `
    SELECT COALESCE(NULLIF(parent_zcta, ''), zip) as zip, state_id
    FROM zips
    WHERE zip = ?
  `,
    zip,
  );
  if (!location) {
    return null;
  }

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

  return { ami, location, calculations };
}
