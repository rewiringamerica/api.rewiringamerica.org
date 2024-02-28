import _ from 'lodash';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { test } from 'tap';
import { AUTHORITIES_BY_STATE } from '../../src/data/authorities';

// These are allowed to exist in authorities.json without being in the database.
//
// TODO these should probably be state-level authorities. Add a field to
// incentives, `utilities: string[]` that expresses which utilities a user must
// be a customer of. That is, separate the concepts of "who offers this
// incentive" from "which utilities must someone be a customer of to get this".
const EXCEPTIONS = new Set([
  'co-tri-state-g-and-t',
  'co-walking-mountains',
  'vt-vppsa',
]);

test('all authorities.json utilities are in DB', async t => {
  const database = await open({
    filename: path.join(__dirname, '../../incentives-api.db'),
    driver: sqlite3.Database,
  });

  const utilityIdLists = Object.values(AUTHORITIES_BY_STATE)
    .map(state => state.utility)
    .map(Object.keys);
  const utilityIds = _.flatten(utilityIdLists).filter(
    id => !EXCEPTIONS.has(id),
  );

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
