import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { test } from 'tap';
import {
  AUTHORITIES_BY_STATE,
  AuthoritiesByType,
} from '../../src/data/authorities';
import { GEO_GROUPS_BY_STATE } from '../../src/data/geo_groups';
import { PROGRAMS } from '../../src/data/programs';
import { STATE_INCENTIVES_BY_STATE } from '../../src/data/state_incentives';

test('geo groups refer to valid geographies', async t => {
  const db = await open({
    filename: path.join(__dirname, '../../incentives-api.db'),
    driver: sqlite3.Database,
  });

  const allGeos = await db.all<{ id: number; state: string }[]>(
    'SELECT id, state FROM geographies',
  );
  const statesById = new Map(allGeos.map(({ id, state }) => [id, state]));

  Object.entries(GEO_GROUPS_BY_STATE).forEach(([state, groups]) => {
    Object.values(groups).forEach(group => {
      group.geographies.forEach(id => t.equal(statesById.get(id), state));
    });
  });
});

test('incentives either have an authority with geography, or eligible_geo_group', async t => {
  for (const [state, stateIncentives] of Object.entries(
    STATE_INCENTIVES_BY_STATE,
  )) {
    for (const incentive of stateIncentives) {
      const program = PROGRAMS[incentive.program];
      const stateAuthorities: AuthoritiesByType = AUTHORITIES_BY_STATE[state];
      const authority =
        stateAuthorities[program.authority_type][program.authority!];
      if (!authority.geography_ids) {
        t.hasProp(
          incentive,
          'eligible_geo_group',
          `incentive must have authority with geography, or geo group (id ${incentive.id})`,
        );
      }
    }
  }
});
