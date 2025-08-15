import _ from 'lodash';
import { test } from 'tap';
import {
  AUTHORITIES_BY_STATE,
  AuthorityType,
} from '../../src/data/authorities';
import { GEO_GROUPS_BY_STATE } from '../../src/data/geo_groups';
import { Programs } from '../../src/data/programs';
import { StateIncentive } from '../../src/data/state_incentives';
import { AmountType } from '../../src/data/types/amount';
import { PaymentMethod } from '../../src/data/types/incentive-types';
import { Item } from '../../src/data/types/items';
import { OwnerStatus } from '../../src/data/types/owner-status';
import {
  applyMassSaveRule,
  EXCEPTION_MLPS,
  MASS_SAVE_AUTHORITY,
  MASS_SAVE_GAS_UTILITY_AUTHORITIES,
  MASS_SAVE_UTILITY_AUTHORITIES,
} from '../../src/lib/mass-save';

const ALL_PROGRAMS = {
  massSave: {
    authority_type: AuthorityType.Other,
    authority: MASS_SAVE_AUTHORITY,
    name: { en: '' },
    url: { en: '' },
  },
  massSaveUtility: {
    authority_type: AuthorityType.Utility,
    authority: MASS_SAVE_UTILITY_AUTHORITIES[0],
    name: { en: '' },
    url: { en: '' },
  },
  normalMlp: {
    authority_type: AuthorityType.Utility,
    authority: 'ma-ashburnham-municipal-light-plant',
    name: { en: '' },
    url: { en: '' },
  },
  combinedMlp: {
    authority_type: AuthorityType.Other,
    authority: 'ma-westfield-gas-and-electric',
    name: { en: '' },
    url: { en: '' },
  },
  exceptionMlp: {
    authority_type: AuthorityType.Utility,
    authority: EXCEPTION_MLPS[0],
    name: { en: '' },
    url: { en: '' },
  },
} as const satisfies Programs;

function inc(
  id: string,
  items: Item[],
  program: keyof typeof ALL_PROGRAMS,
): [string, StateIncentive] {
  return [
    id,
    {
      id,
      items,
      program,
      short_description: { en: '' },
      amount: {
        number: 1,
        type: AmountType.DollarAmount,
      },
      payment_methods: [PaymentMethod.Rebate],
      owner_status: [OwnerStatus.Homeowner],
      url: { en: '' },
    },
  ];
}

const CASES: Record<string, [[string, StateIncentive][], string[]]> = {
  normalMlpDisjoint: [
    [
      inc('MA-1', ['air_sealing'], 'massSave'),
      inc('MA-2', ['duct_sealing'], 'normalMlp'),
    ],
    ['MA-1', 'MA-2'],
  ],
  normalMlpSubset: [
    [
      inc('MA-1', ['air_sealing', 'duct_sealing'], 'massSave'),
      inc('MA-2', ['air_sealing'], 'normalMlp'),
    ],
    ['MA-1'],
  ],
  normalMlpOverlap: [
    [
      inc('MA-1', ['air_sealing'], 'massSave'),
      // This survives because it has an item not covered by MS
      inc('MA-2', ['air_sealing', 'duct_sealing'], 'normalMlp'),
    ],
    ['MA-1', 'MA-2'],
  ],
  combinedMlpDisjoint: [
    [
      inc('MA-1', ['air_sealing'], 'massSave'),
      inc('MA-2', ['duct_sealing'], 'combinedMlp'),
    ],
    ['MA-1', 'MA-2'],
  ],
  combinedMlpSubset: [
    [
      inc('MA-1', ['air_sealing', 'duct_sealing'], 'massSave'),
      inc('MA-2', ['air_sealing'], 'combinedMlp'),
    ],
    ['MA-1'],
  ],
  combinedMlpOverlap: [
    [
      inc('MA-1', ['air_sealing'], 'massSave'),
      // This survives because it has an item not covered by MS
      inc('MA-2', ['air_sealing', 'duct_sealing'], 'combinedMlp'),
    ],
    ['MA-1', 'MA-2'],
  ],
  exceptionMlpOverlap: [
    [
      inc('MA-1', ['air_sealing'], 'massSave'),
      inc('MA-2', ['air_sealing'], 'exceptionMlp'),
    ],
    ['MA-1', 'MA-2'],
  ],
  massSaveUtility: [
    [
      inc('MA-1', ['air_sealing'], 'massSaveUtility'),
      // This survives because the rule doesn't apply
      inc('MA-2', ['air_sealing'], 'normalMlp'),
    ],
    ['MA-1', 'MA-2'],
  ],
};

test('all cases', async t => {
  Object.entries(CASES).forEach(([caseName, params]) => {
    const [eligible, expectedEligible] = params;
    const eligibleMap = new Map(eligible);
    const ineligibleMap = new Map();
    applyMassSaveRule(eligibleMap, ineligibleMap, ALL_PROGRAMS);

    t.strictSame(
      Array.from(eligibleMap.keys()),
      expectedEligible,
      `${caseName}: wrong eligible set`,
    );
    eligible.forEach(([key]) => {
      if (!expectedEligible.includes(key) && !ineligibleMap.has(key)) {
        t.fail(`${caseName}: ${key} was not moved to ineligible set`);
      }
    });
  });
});

test('all hardcoded authorities are real', async t => {
  for (const authKey of [...EXCEPTION_MLPS, ...MASS_SAVE_UTILITY_AUTHORITIES]) {
    t.ok(
      authKey in AUTHORITIES_BY_STATE['MA'].utility,
      `${authKey} not in MA utilities`,
    );
  }

  for (const authKey of MASS_SAVE_GAS_UTILITY_AUTHORITIES) {
    t.ok(
      authKey in AUTHORITIES_BY_STATE['MA'].gas_utility!,
      `${authKey} not in MA gas utilities`,
    );
  }

  t.ok(
    MASS_SAVE_AUTHORITY in (AUTHORITIES_BY_STATE['MA'].other || {}),
    'ma-massSave not in MA "other"',
  );
});

test('geographies for hardcoded MS authorities match geo groups', async t => {
  const geoIds = new Set();

  for (const authKey of MASS_SAVE_UTILITY_AUTHORITIES) {
    const auth = AUTHORITIES_BY_STATE['MA'].utility[authKey];
    auth.geography_ids?.forEach(id => geoIds.add(id));
  }

  const electricGroupIds =
    GEO_GROUPS_BY_STATE['MA']['ma-mass-save-electric'].geographies;

  t.strictSame(
    _.sortBy(Array.from(geoIds.values())),
    _.sortBy(electricGroupIds),
  );

  for (const authKey of MASS_SAVE_GAS_UTILITY_AUTHORITIES) {
    const auth = AUTHORITIES_BY_STATE['MA'].gas_utility![authKey];
    auth.geography_ids?.forEach(id => geoIds.add(id));
  }

  const combinedGroupIds =
    GEO_GROUPS_BY_STATE['MA']['ma-mass-save'].geographies;

  t.strictSame(
    _.sortBy(Array.from(geoIds.values())),
    _.sortBy(combinedGroupIds),
  );
});
