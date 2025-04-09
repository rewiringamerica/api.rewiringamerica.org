import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { test } from 'tap';
import util from 'util';

// These are uninhabited islands; no ZCTA covers them
const EXCEPTIONS = [
  { id: 3194, name: 'Rose Island' },
  { id: 3198, name: 'Northern Islands Municipality' },
];

test('all geographies intersect with at least one ZCTA', async t => {
  const database = await open({
    filename: path.join(__dirname, '../../incentives-api.db'),
    driver: sqlite3.Database,
  });

  const geosWithoutZcta = await database.all<{ id: number; name: string }[]>(
    `SELECT id, name
    FROM geographies g
    LEFT OUTER JOIN zcta_to_geography zg ON g.id = zg.geography_id
    WHERE zg.geography_id IS NULL
    ORDER BY g.id`,
  );

  t.strictSame(
    geosWithoutZcta,
    EXCEPTIONS,
    `Geographies have no ZCTAS: ${util.inspect(geosWithoutZcta)}`,
  );
});
