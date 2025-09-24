import sqlite3 from 'better-sqlite3';
import path from 'path';
import { test } from 'tap';
import util from 'util';

// These are uninhabited islands; no ZCTA covers them
const EXCEPTIONS = [
  { id: 3194, name: 'Rose Island' },
  { id: 3198, name: 'Northern Islands Municipality' },
];

test('all geographies intersect with at least one ZCTA', async t => {
  const database = sqlite3(path.join(__dirname, '../../incentives-api.db'));

  const geosWithoutZcta = database
    .prepare<[], { id: number; name: string }>(
      `SELECT id, name
    FROM geographies g
    LEFT OUTER JOIN zcta_to_geography zg ON g.id = zg.geography_id
    WHERE zg.geography_id IS NULL
    AND g.type NOT IN ('electric_territory', 'gas_territory')
    ORDER BY g.id`,
    )
    .all();

  t.strictSame(
    geosWithoutZcta,
    EXCEPTIONS,
    `Geographies have no ZCTAS: ${util.inspect(geosWithoutZcta)}`,
  );
});
