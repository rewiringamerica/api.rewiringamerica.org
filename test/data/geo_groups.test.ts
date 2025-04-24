import { test } from 'tap';
import {
  AUTHORITIES_BY_STATE,
  AuthoritiesByType,
  AuthorityType,
} from '../../src/data/authorities';
import { GEO_GROUPS_BY_STATE } from '../../src/data/geo_groups';
import { PROGRAMS } from '../../src/data/programs';
import {
  STATE_INCENTIVES_BY_STATE,
  StateIncentive,
} from '../../src/data/state_incentives';

test('geo groups refer to valid authorities', async t => {
  Object.entries(GEO_GROUPS_BY_STATE).forEach(([state, groups]) => {
    const authorities = AUTHORITIES_BY_STATE[state];

    Object.values(groups).forEach(group => {
      group.utilities?.forEach(utility =>
        t.hasProp(authorities.utility, utility),
      );
      group.gas_utilities?.forEach(
        gas_utility =>
          t.ok(authorities.gas_utility) &&
          t.hasProp(authorities.gas_utility!, gas_utility),
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

function computeIdToIncentiveMap(incentives: StateIncentive[]) {
  const output: { [index: string]: StateIncentive } = {};
  for (const incentive of incentives) {
    output[incentive.id] = incentive;
  }
  return output;
}

test('geo groups are equivalent in JSON config and incentives', async t => {
  // All incentives have the geo group indicated in their config.
  const map = computeIdToIncentiveMap(
    Object.values(STATE_INCENTIVES_BY_STATE).flat(),
  );
  Object.entries(GEO_GROUPS_BY_STATE).forEach(([, stateGeoGroups]) => {
    for (const [identifier, geoGroup] of Object.entries(stateGeoGroups)) {
      for (const incentiveId of geoGroup.incentives) {
        const incentive = map[incentiveId];
        t.equal(
          incentive.eligible_geo_group,
          identifier,
          `Geo_group ${identifier} claims incentive ${incentive.id}, but the incentives.json file does not reflect that`,
        );
      }
    }
  });
  // Converse: all geo group configs accurately reflect the incentive IDs.
  for (const [stateId, stateIncentives] of Object.entries(
    STATE_INCENTIVES_BY_STATE,
  )) {
    for (const incentive of stateIncentives) {
      if (incentive.eligible_geo_group) {
        const stateGeoGroups = GEO_GROUPS_BY_STATE[stateId];
        t.hasProp(stateGeoGroups, incentive.eligible_geo_group);
        t.ok(
          stateGeoGroups[incentive.eligible_geo_group].incentives.includes(
            incentive.id,
          ),
          `${incentive.id} claims eligible_geo_group ${incentive.eligible_geo_group}, but data/geo_groups.json does not reflect that`,
        );
      }
    }
  }
});

test('incentives either have an authority with geography, or eligible_geo_group', async t => {
  for (const [state, stateIncentives] of Object.entries(
    STATE_INCENTIVES_BY_STATE,
  )) {
    for (const incentive of stateIncentives) {
      const program = PROGRAMS[incentive.program];
      if (
        program.authority_type === AuthorityType.Utility ||
        program.authority_type === AuthorityType.GasUtility
      ) {
        // Utilities don't have geographies
        continue;
      }

      const stateAuthorities: AuthoritiesByType = AUTHORITIES_BY_STATE[state];
      const authority =
        stateAuthorities[program.authority_type][program.authority!];
      if (!authority.geography_id) {
        t.hasProp(
          incentive,
          'eligible_geo_group',
          `incentive must have authority with geography, or geo group (id ${incentive.id})`,
        );
      }
    }
  }
});
