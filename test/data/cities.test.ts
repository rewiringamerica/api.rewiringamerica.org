import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { test } from 'tap';
import { AUTHORITIES_BY_STATE } from '../../src/data/authorities';

test('all city authorities exist in zips table', async t => {
  const database = await open({
    filename: path.join(__dirname, '../../incentives-api.db'),
    driver: sqlite3.Database,
  });

  for (const auths of Object.values(AUTHORITIES_BY_STATE)) {
    for (const [authorityKey, data] of Object.entries(auths.city || {})) {
      // If there are no zip codes with this postal city name and county FIPS,
      // no user location can resolve to this authority.
      const result = await database.get<{ count: number }>(
        'SELECT count(1) AS count FROM zips WHERE city = ? AND county_fips = ?',
        data.city!,
        data.county_fips!,
      );

      t.not(
        result!.count,
        0,
        `${authorityKey} does not correspond to a postal city`,
      );
    }
  }
});
