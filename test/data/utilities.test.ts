import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { test } from 'tap';
import { AUTHORITIES_BY_STATE } from '../../src/data/authorities';

test('all authorities.json utilities are in DB', async t => {
  const database = await open({
    filename: path.join(__dirname, '../../incentives-api.db'),
    driver: sqlite3.Database,
  });

  const allUtilityIds = Object.values(AUTHORITIES_BY_STATE)
    .map(state => state.utility)
    .map(Object.keys)
    .flat();

  const query = await database.all<{ utility_id: string; ct: number }[]>(
    'SELECT utility_id, COUNT(1) AS ct FROM zip_to_utility GROUP BY utility_id',
  );
  const utilityCounts = Object.fromEntries(
    query!.map(({ utility_id, ct }) => [utility_id, ct]),
  );

  for (const id of allUtilityIds) {
    t.ok(
      utilityCounts[id] > 0,
      `utility ${id} does not appear in zip_to_utility`,
    );
  }
});
