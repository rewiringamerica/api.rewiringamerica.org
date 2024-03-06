import { test } from 'tap';
import { AUTHORITIES_BY_STATE } from '../../src/data/authorities';
import { GEO_GROUPS_BY_STATE } from '../../src/data/geo_groups';

test('geo groups refer to valid authorities', async t => {
  Object.entries(GEO_GROUPS_BY_STATE).forEach(([state, groups]) => {
    const authorities = AUTHORITIES_BY_STATE[state];

    Object.values(groups).forEach(group => {
      group.utilities?.forEach(utility =>
        t.hasProp(authorities.utility, utility),
      );
      group.counties?.forEach(
        county =>
          t.ok(authorities.county) && t.hasProp(authorities.county!, county),
      );
      group.cities?.forEach(
        city => t.ok(authorities.city) && t.hasProp(authorities.city!, city),
      );
    });
  });
});
