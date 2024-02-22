import { test } from 'tap';
import {
  AUTHORITIES_BY_STATE,
  SCHEMA as AUTHORITIES_SCHEMA,
  AuthorityType,
} from '../../src/data/authorities';
import {
  IRAIncentive,
  IRA_INCENTIVES,
  SCHEMA as I_SCHEMA,
} from '../../src/data/ira_incentives';
import {
  IRA_STATE_SAVINGS,
  SCHEMA as ISS_SCHEMA,
} from '../../src/data/ira_state_savings';
import { LOCALES, SCHEMA as L_SCHEMA } from '../../src/data/locale';
import {
  LOW_INCOME_THRESHOLDS_BY_AUTHORITY,
  SCHEMA as LOW_INCOME_THRESHOLDS_SCHEMA,
} from '../../src/data/low_income_thresholds';
import { SOLAR_PRICES, SCHEMA as SP_SCHEMA } from '../../src/data/solar_prices';
import {
  CO_RELATIONSHIPS,
  CT_RELATIONSHIPS,
  INCENTIVE_RELATIONSHIPS_SCHEMA,
  IncentiveRelationships,
  VT_RELATIONSHIPS,
} from '../../src/data/state_incentive_relationships';
import {
  AZ_INCENTIVES,
  AZ_INCENTIVES_SCHEMA,
  CO_INCENTIVES,
  CO_INCENTIVES_SCHEMA,
  CT_INCENTIVES,
  CT_INCENTIVES_SCHEMA,
  NY_INCENTIVES,
  NY_INCENTIVES_SCHEMA,
  RI_INCENTIVES,
  RI_INCENTIVES_SCHEMA,
  StateIncentive,
  VA_INCENTIVES,
  VA_INCENTIVES_SCHEMA,
  VT_INCENTIVES,
  VT_INCENTIVES_SCHEMA,
} from '../../src/data/state_incentives';
import { SCHEMA as SMFI_SCHEMA, STATE_MFIS } from '../../src/data/state_mfi';
import { TAX_BRACKETS, SCHEMA as TB_SCHEMA } from '../../src/data/tax_brackets';

import Ajv from 'ajv/dist/2020';
import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import {
  ALL_PROGRAMS,
  PROGRAMS,
  PROGRAMS_SCHEMA,
} from '../../src/data/programs';
import { PaymentMethod } from '../../src/data/types/incentive-types';
import { LOCALIZABLE_STRING_SCHEMA } from '../../src/data/types/localizable-string';
import { LAUNCHED_STATES } from '../../src/data/types/states';
import {
  addPrerequisites,
  buildRelationshipGraph,
} from '../../src/lib/incentive-relationship-calculation';

const TESTS = [
  [I_SCHEMA, IRA_INCENTIVES, 'ira_incentives'],
  [ISS_SCHEMA, IRA_STATE_SAVINGS, 'ira_state_savings'],
  [L_SCHEMA, LOCALES.en, 'en locale'],
  [L_SCHEMA, LOCALES.es, 'es locale'],
  [SP_SCHEMA, SOLAR_PRICES, 'solar_prices'],
  [SMFI_SCHEMA, STATE_MFIS, 'state_mfis'],
  [TB_SCHEMA, TAX_BRACKETS, 'tax_brackets'],
  [AUTHORITIES_SCHEMA, AUTHORITIES_BY_STATE, 'authorities'],
  [PROGRAMS_SCHEMA, PROGRAMS, 'programs'],
  [
    LOW_INCOME_THRESHOLDS_SCHEMA,
    LOW_INCOME_THRESHOLDS_BY_AUTHORITY,
    'State low income',
  ],
];

test('static JSON files match schema', async tap => {
  tap.plan(TESTS.length);
  const ajv = new Ajv({ schemas: [LOCALIZABLE_STRING_SCHEMA] });

  TESTS.forEach(([schema, data, label]) => {
    if (!tap.ok(ajv.validate(schema, data))) {
      console.error(label, ajv.errors);
    }
  });
});

const STATE_INCENTIVE_TESTS: [string, SomeJSONSchema, StateIncentive[]][] = [
  ['AZ', AZ_INCENTIVES_SCHEMA, AZ_INCENTIVES],
  ['CO', CO_INCENTIVES_SCHEMA, CO_INCENTIVES],
  ['CT', CT_INCENTIVES_SCHEMA, CT_INCENTIVES],
  ['NY', NY_INCENTIVES_SCHEMA, NY_INCENTIVES],
  ['RI', RI_INCENTIVES_SCHEMA, RI_INCENTIVES],
  ['VA', VA_INCENTIVES_SCHEMA, VA_INCENTIVES],
  ['VT', VT_INCENTIVES_SCHEMA, VT_INCENTIVES],
];

const STATE_INCENTIVE_RELATIONSHIP_TESTS: [string, IncentiveRelationships][] = [
  ['CO', CO_RELATIONSHIPS],
  ['CT', CT_RELATIONSHIPS],
  ['VT', VT_RELATIONSHIPS],
];

/**
 * Checks some invariants of incentives that aren't expressible in schemas.
 */
function isIncentiveAmountValid<T extends StateIncentive>(
  incentive: T,
): boolean {
  // Validate the amount has the right properties given its type.
  const { amount } = incentive;
  switch (amount.type) {
    case 'dollar_amount':
      return !amount.unit && !amount.representative;
    case 'percent':
      return amount.number >= 0 && amount.number <= 1 && !amount.unit;
    case 'dollars_per_unit':
      return amount.unit !== undefined;
    default:
      return false;
  }
}

test('state incentives JSON files match schemas', async tap => {
  const ajv = new Ajv({ schemas: [LOCALIZABLE_STRING_SCHEMA] });

  STATE_INCENTIVE_TESTS.forEach(([stateId, schema, data]) => {
    const authorities = AUTHORITIES_BY_STATE[stateId as string];

    if (!tap.ok(ajv.validate(schema, data), `${stateId} incentives invalid`)) {
      console.error(ajv.errors);
    }

    // Validate that each incentive has a unique ID.
    const incentiveIds = new Set<string>();

    // Check some constraints that aren't expressed in JSON schema
    data.forEach((incentive, index) => {
      tap.ok(
        incentive.short_description.en.length <= 150,
        `${stateId} English description too long ` +
          `(${incentive.short_description.en.length}), id ${incentive.id}, index ${index}`,
      );

      // We let Spanish descriptions be a little longer
      if (incentive.short_description.es) {
        tap.ok(
          incentive.short_description.es.length <= 160,
          `${stateId} Spanish description too long ` +
            `(${incentive.short_description.en.length}), id ${incentive.id}, index ${index}`,
        );
      }
      tap.ok(
        isIncentiveAmountValid(incentive),
        `amount is invalid (${stateId}, id ${incentive.id}, index ${index})`,
      );
      tap.hasProp(
        authorities[
          incentive.authority_type as 'state' | 'utility' | 'county' | 'city'
        ]!,
        incentive.authority,
        `nonexistent authority (${stateId}, id ${incentive.id}, index ${index})`,
      );
      if (incentive.authority_type === AuthorityType.County) {
        tap.hasProp(
          authorities[incentive.authority_type]![incentive.authority],
          'county',
          `must define county attribute on corresponding authority ${incentive.authority} for incentives with county authority type`,
        );
      }
      if (incentive.authority_type === AuthorityType.City) {
        tap.hasProp(
          authorities[incentive.authority_type]![incentive.authority],
          'county',
          `must define county attribute on corresponding authority ${incentive.authority} for incentives with city authority type (county is used for matching)`,
        );
        tap.hasProp(
          authorities[incentive.authority_type]![incentive.authority],
          'city',
          `must define city attribute on corresponding authority ${incentive.authority} for incentives with city authority type`,
        );
      }

      // Allow duplicate incentive IDs if we split one incentive into multiple due
      // to tax filing status
      if (incentive.filing_status === null) {
        tap.equal(incentiveIds.has(incentive.id), false);
      }
      incentiveIds.add(incentive.id);
    });
  });
});

test('All IRA incentives have more_info links populated for their items', async tap => {
  IRA_INCENTIVES.forEach((incentive: IRAIncentive) => {
    const item = incentive.item;
    for (const [lang, locale] of Object.entries(LOCALES)) {
      tap.ok(
        item in locale.urls,
        `Technology ${item} has no more_info link in locale ${lang}, but is used in IRA Incentive ${incentive.id}`,
      );
    }
  });
});

test("launched states do not have any values that we don't support for broader consumption in the API", async tap => {
  STATE_INCENTIVE_TESTS.forEach(([state, , data]) => {
    if (LAUNCHED_STATES.includes(state)) {
      for (const incentive of data) {
        // TODO: remove once City/County incentives have been beta-tested.
        tap.not(incentive.authority_type, AuthorityType.City);
        tap.not(incentive.authority_type, AuthorityType.County);

        tap.notOk(incentive.payment_methods.includes(PaymentMethod.Unknown));
      }
    }
  });
});

test('programs in data are exactly those in code', async tap => {
  tap.same(Object.keys(PROGRAMS).sort(), Array.from(ALL_PROGRAMS).sort());
});

const isURLValid = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};
test('all programs have valid URLs', async tap => {
  for (const [programId, data] of Object.entries(PROGRAMS)) {
    for (const url of Object.values(data.url ?? [])) {
      tap.ok(isURLValid(url), `${programId} has invalid URL`);
    }
  }
});

test('locale URLs are valid', async tap => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    for (const [key, url] of Object.entries(locale.urls)) {
      tap.ok(isURLValid(url), `${lang}.urls.${key} invalid`);
    }
  }
});

test('state incentive relationships JSON files match schemas', async tap => {
  const ajv = new Ajv();

  STATE_INCENTIVE_RELATIONSHIP_TESTS.forEach(([stateId, data]) => {
    if (
      !tap.ok(
        ajv.validate(INCENTIVE_RELATIONSHIPS_SCHEMA, data),
        `${stateId} incentive relationships invalid`,
      )
    ) {
      console.error(ajv.errors);
    }
  });
});

// Helper to check for circular dependencies in the incentive relationships.
export function checkForCycle(
  incentiveId: string,
  seen: Set<string>,
  finished: Set<string>,
  edges: Map<string, Set<string>>,
) {
  if (finished.has(incentiveId)) {
    // We've already finished checking this incentive.
    return false;
  }
  if (seen.has(incentiveId)) {
    // We haven't finished checking this incentive's dependencies but are
    // visiting it for the second time. This is a cycle.
    return true;
  }
  seen.add(incentiveId);
  const dependencies = edges.get(incentiveId);
  if (dependencies !== undefined) {
    for (const id of dependencies) {
      if (checkForCycle(id, seen, finished, edges)) {
        return true;
      }
    }
  }
  finished.add(incentiveId);
  return false;
}

export function incentiveRelationshipsContainCycle(
  relationshipGraph: Map<string, Set<string>>,
) {
  const seen = new Set<string>();
  const finished = new Set<string>();
  const toCheck = Array.from(relationshipGraph.keys());
  let hasCycle = false;
  if (toCheck !== undefined) {
    for (const incentiveId of toCheck) {
      hasCycle = checkForCycle(incentiveId, seen, finished, relationshipGraph);
      if (hasCycle) {
        break;
      }
    }
  }
  return hasCycle;
}

test('state incentive relationships contain no circular dependencies', async tap => {
  STATE_INCENTIVE_RELATIONSHIP_TESTS.forEach(([, data]) => {
    // Check that there are no circular dependencies in the relationships.
    const relationshipGraph = buildRelationshipGraph(data);
    tap.equal(incentiveRelationshipsContainCycle(relationshipGraph), false);
  });
});

test('state incentive relationships only reference real IDs', async tap => {
  // Collect all the incentive IDs we know about.
  const incentiveIds = new Map<string, Set<string>>();
  STATE_INCENTIVE_TESTS.forEach(([stateId, , data]) => {
    // Check some constraints that aren't expressed in JSON schema
    const ids = new Set<string>();
    data.forEach(incentive => {
      ids.add(incentive.id);
    });
    incentiveIds.set(stateId, ids);
  });

  // Check that all of the incentive relationships reference IDs that exist.
  STATE_INCENTIVE_RELATIONSHIP_TESTS.forEach(([stateId, data]) => {
    // Must have incentives for this state in order to have relationships.
    tap.equal(incentiveIds.has(stateId), true);

    const incentivesForState = incentiveIds.get(stateId);
    if (incentivesForState !== undefined) {
      if (data.prerequisites !== undefined) {
        for (const [incentiveId, prerequisites] of Object.entries(
          data.prerequisites,
        )) {
          tap.equal(incentivesForState.has(incentiveId), true);
          const prerequisiteIds = new Set<string>();
          addPrerequisites(prerequisites, prerequisiteIds);
          for (const id of prerequisiteIds) {
            tap.equal(incentivesForState.has(id), true);
          }
        }
      }
      if (data.exclusions !== undefined) {
        for (const [incentiveId, supersededIds] of Object.entries(
          data.exclusions,
        )) {
          tap.equal(incentivesForState.has(incentiveId), true);
          for (const id of supersededIds) {
            tap.equal(incentivesForState.has(id), true);
          }
        }
      }
      if (data.combinations !== undefined) {
        for (const relationship of data.combinations) {
          for (const id of relationship.ids) {
            tap.equal(incentivesForState.has(id), true);
          }
        }
      }
    }
  });
});

// For simplicity, an incentive can only be included in one max value grouping. Otherwise,
// the order of evaluation could affect the total eligible savings.
// Also, enforce that a single incentive ID is not included twice within the same grouping.
test('incentive combined value groupings contain no duplicate IDs', async tap => {
  STATE_INCENTIVE_RELATIONSHIP_TESTS.forEach(([, data]) => {
    if (data.combinations !== undefined) {
      const incentiveIds = new Set<string>();
      for (const relationship of data.combinations) {
        for (const id of relationship.ids) {
          tap.equal(incentiveIds.has(id), false);
          incentiveIds.add(id);
        }
      }
    }
  });
});
