import _ from 'lodash';
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

  const utilityIdLists = Object.values(AUTHORITIES_BY_STATE)
    .map(state => state.utility)
    .map(Object.keys);
  const utilityIds = _.flatten(utilityIdLists);

  for (const utilityId of utilityIds) {
    t.ok(
      await database.get(
        'SELECT 1 FROM utilities WHERE utility_id = ?',
        utilityId,
      ),
      `${utilityId} missing from dataset`,
    );
  }
});
