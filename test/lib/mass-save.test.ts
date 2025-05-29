import { test } from 'tap';
import {
  AUTHORITIES_BY_STATE,
  AuthorityType,
} from '../../src/data/authorities';
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
  MASS_SAVE_GAS_UTILITIES,
  MASS_SAVE_UTILITIES,
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
    authority: MASS_SAVE_UTILITIES[0],
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
  for (const auth of EXCEPTION_MLPS) {
    t.ok(
      auth in AUTHORITIES_BY_STATE['MA'].utility,
      `${auth} not in MA utilities`,
    );
  }

  t.ok(MASS_SAVE_UTILITIES.length > 0);
  t.ok(MASS_SAVE_GAS_UTILITIES.length > 0);

  t.ok(
    MASS_SAVE_AUTHORITY in (AUTHORITIES_BY_STATE['MA'].other || {}),
    'ma-massSave not in MA "other"',
  );
});
