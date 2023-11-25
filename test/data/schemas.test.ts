import { test } from 'tap';
import {
  CT_LOW_INCOME_THRESHOLDS_BY_AUTHORITY,
  SCHEMA as CT_LOW_INCOME_THRESHOLDS_SCHEMA,
} from '../../src/data/CT/low_income_thresholds';
import {
  RI_LOW_INCOME_THRESHOLDS_BY_AUTHORITY,
  SCHEMA as RI_LOW_INCOME_THRESHOLDS_SCHEMA,
} from '../../src/data/RI/low_income_thresholds';
import {
  AUTHORITIES_BY_STATE,
  SCHEMA as AUTHORITIES_SCHEMA,
} from '../../src/data/authorities';
import {
  IRA_INCENTIVES,
  SCHEMA as I_SCHEMA,
} from '../../src/data/ira_incentives';
import {
  IRA_STATE_SAVINGS,
  SCHEMA as ISS_SCHEMA,
} from '../../src/data/ira_state_savings';
import { LOCALES, SCHEMA as L_SCHEMA } from '../../src/data/locale';
import { SOLAR_PRICES, SCHEMA as SP_SCHEMA } from '../../src/data/solar_prices';
import {
  CT_RELATIONSHIPS,
  INCENTIVE_RELATIONSHIPS_SCHEMA,
  IncentiveRelationships,
} from '../../src/data/state_incentive_relationships';
import {
  CT_INCENTIVES,
  CT_INCENTIVES_SCHEMA,
  NY_INCENTIVES,
  NY_INCENTIVES_SCHEMA,
  RI_INCENTIVES,
  RI_INCENTIVES_SCHEMA,
  StateIncentive,
} from '../../src/data/state_incentives';
import { SCHEMA as SMFI_SCHEMA, STATE_MFIS } from '../../src/data/state_mfi';
import { TAX_BRACKETS, SCHEMA as TB_SCHEMA } from '../../src/data/tax_brackets';

import Ajv from 'ajv';
import { SomeJSONSchema } from 'ajv/dist/types/json-schema';

const TESTS = [
  [I_SCHEMA, IRA_INCENTIVES, 'ira_incentives'],
  [ISS_SCHEMA, IRA_STATE_SAVINGS, 'ira_state_savings'],
  [L_SCHEMA, LOCALES.en, 'en locale'],
  [L_SCHEMA, LOCALES.es, 'es locale'],
  [SP_SCHEMA, SOLAR_PRICES, 'solar_prices'],
  [SMFI_SCHEMA, STATE_MFIS, 'state_mfis'],
  [TB_SCHEMA, TAX_BRACKETS, 'tax_brackets'],
  [AUTHORITIES_SCHEMA, AUTHORITIES_BY_STATE, 'authorities'],
  [
    CT_LOW_INCOME_THRESHOLDS_SCHEMA,
    CT_LOW_INCOME_THRESHOLDS_BY_AUTHORITY,
    'CT low income',
  ],
  [
    RI_LOW_INCOME_THRESHOLDS_SCHEMA,
    RI_LOW_INCOME_THRESHOLDS_BY_AUTHORITY,
    'RI low income',
  ],
];

test('static JSON files match schema', async tap => {
  tap.plan(TESTS.length);
  const ajv = new Ajv();

  TESTS.forEach(([schema, data, label]) => {
    if (!tap.ok(ajv.validate(schema, data))) {
      console.error(label, ajv.errors);
    }
  });
});

const STATE_INCENTIVE_TESTS: [string, SomeJSONSchema, StateIncentive[]][] = [
  ['CT', CT_INCENTIVES_SCHEMA, CT_INCENTIVES],
  ['NY', NY_INCENTIVES_SCHEMA, NY_INCENTIVES],
  ['RI', RI_INCENTIVES_SCHEMA, RI_INCENTIVES],
];

const STATE_INCENTIVE_RELATIONSHIP_TESTS: [
  string,
  IncentiveRelationships,
  IncentiveRelationships,
][] = [
  ['CT', INCENTIVE_RELATIONSHIPS_SCHEMA, CT_RELATIONSHIPS],
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
  const ajv = new Ajv();

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
        isIncentiveAmountValid(incentive),
        `amount is invalid (${stateId}, index ${index})`,
      );
      tap.hasProp(
        authorities[incentive.authority_type as 'state' | 'utility'],
        incentive.authority,
        `nonexistent authority (${stateId}, index ${index})`,
      );

      tap.equal(incentiveIds.has(incentive.id), false);
      incentiveIds.add(incentive.id);
    });
  });
});

const isURLValid = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

test('locale URLs are valid', async tap => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    for (const [key, url] of Object.entries(locale.urls)) {
      tap.ok(isURLValid(url), `${lang}.urls.${key} invalid`);
    }
    for (const [key, url] of Object.entries(locale.program_urls)) {
      tap.ok(isURLValid(url), `${lang}.program_urls.${key} invalid`);
    }
  }
});

// Builds a graph of incentive relationships, represented as pairs of incentive
// ID and the set of IDs of incentives that are dependent on that incentive.
function buildRelationshipGraph(data: IncentiveRelationships) {
  const edges = new Map<string, Set<string>>();
  // For exclusion relationships, the superseding incentive is the "source."
  if (data.exclusions) {
    for (const relationship of data.exclusions) {
      edges.set(relationship.id, new Set(relationship.supersedes));
    }
  }
  // For prerequisite relationships, the required incentive is the "source."
  if (data.prerequisites) {
    for (const relationship of data.prerequisites) {
      const targetId = relationship.id;
      for (const sourceId of relationship.requires) {
        let existingTargetIds = edges.get(sourceId);
        if (existingTargetIds != undefined) {
          existingTargetIds.add(targetId);
        } else {
          existingTargetIds = new Set<string>([targetId]);
          edges.set(sourceId, existingTargetIds);
        }
      }
    }
  }
  return edges;
}

// Helper to check for circular dependencies in the incentive relationships.
function checkForCycle(
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
  if (dependencies != undefined) {
    for (const id of dependencies) {
      if (checkForCycle(id, seen, finished, edges)) {
        return true;
      }
    }
  }
  finished.add(incentiveId);
  return false;
}

test('state incentive relationships JSON files match schemas', async tap => {
  const ajv = new Ajv();

  STATE_INCENTIVE_RELATIONSHIP_TESTS.forEach(([stateId, schema, data]) => {
    if (
      !tap.ok(
        ajv.validate(schema, data),
        `${stateId} incentive relationships invalid`,
      )
    ) {
      console.error(ajv.errors);
    }

    // Check that there are no circular dependencies in the relationships.
    const relationshipGraph = buildRelationshipGraph(data);
    const seen = new Set<string>();
    const finished = new Set<string>();
    const toCheck = Array.from(relationshipGraph.keys());
    let hasCycle = false;
    if (toCheck != undefined) {
      for (const incentiveId of toCheck) {
        hasCycle = checkForCycle(
          incentiveId,
          seen,
          finished,
          relationshipGraph,
        );
        if (hasCycle) {
          break;
        }
      }
    }
    tap.equal(hasCycle, false);
  });
});
