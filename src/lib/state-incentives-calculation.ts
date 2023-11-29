import { AuthorityType } from '../data/authorities';
import { LOW_INCOME_THRESHOLDS_BY_AUTHORITY } from '../data/low_income_thresholds';
import {
  INCENTIVE_RELATIONSHIPS_BY_STATE,
  IncentiveRelationships,
} from '../data/state_incentive_relationships';
import {
  STATE_INCENTIVES_BY_STATE,
  StateIncentive,
} from '../data/state_incentives';
import { AmountType } from '../data/types/amount';
import { APICoverage } from '../data/types/coverage';
import { OwnerStatus } from '../data/types/owner-status';
import { BETA_STATES, LAUNCHED_STATES } from '../data/types/states';
import { APISavings, zeroSavings } from '../schemas/v1/savings';
import { CalculateParams, CalculatedIncentive } from './incentives-calculation';

export function getAllStateIncentives(
  stateId: string,
  request: CalculateParams,
) {
  // Only process incentives for launched states, or beta states if beta was requested.
  if (
    !LAUNCHED_STATES.includes(stateId) &&
    (!request.include_beta_states || !BETA_STATES.includes(stateId))
  ) {
    return [];
  }
  return STATE_INCENTIVES_BY_STATE[stateId];
}

export function calculateStateIncentivesAndSavings(
  stateId: string,
  request: CalculateParams,
  incentives: StateIncentive[],
): {
  stateIncentives: CalculatedIncentive[];
  savings: APISavings;
  coverage: APICoverage;
} {
  if (incentives.length == 0) {
    return {
      stateIncentives: [],
      savings: zeroSavings(),
      coverage: { state: null, utility: null },
    };
  }

  const includeState =
    !request.authority_types ||
    request.authority_types.includes(AuthorityType.State);
  const includeUtility =
    !request.authority_types ||
    request.authority_types.includes(AuthorityType.Utility);

  const eligibleIncentives = new Map<string, StateIncentive>();
  const ineligibleIncentives = new Map<string, StateIncentive>();

  for (const item of incentives) {
    if (request.items && !request.items.includes(item.item)) {
      // Don't include an incentive at all if the query is filtering by item and
      // this doesn't match.
      continue;
    }

    if (item.authority_type === AuthorityType.State && !includeState) {
      // Don't include state incentives at all if they weren't requested, not
      // even as "ineligible" incentives.
      continue;
    }

    if (
      item.authority_type === AuthorityType.Utility &&
      (!includeUtility || item.authority !== request.utility)
    ) {
      // Don't include utility incentives at all if they weren't requested, or
      // if they're for the wrong utility.
      continue;
    }

    let eligible = true;

    if (!item.owner_status.includes(request.owner_status as OwnerStatus)) {
      eligible = false;
    }

    if (!LOW_INCOME_THRESHOLDS_BY_AUTHORITY[stateId]) {
      console.log('No income thresholds defined for ', stateId);
    }
    const thresholds_map = LOW_INCOME_THRESHOLDS_BY_AUTHORITY[stateId];

    if (typeof thresholds_map !== 'undefined') {
      if (item.low_income) {
        const authorities =
          thresholds_map[item.low_income] ?? thresholds_map.default;
        if (
          request.household_income >
          authorities.thresholds[request.household_size]
        ) {
          eligible = false;
        }
      }
    }

    if (eligible) {
      eligibleIncentives.set(item.id, item);
    } else {
      ineligibleIncentives.set(item.id, item);
    }
  }

  const prerequisiteMaps = buildPrerequisiteMaps(
    INCENTIVE_RELATIONSHIPS_BY_STATE[stateId],
  );

  // Use relationship maps to update incentive eligibility.
  for (const prereqRelationship of prerequisiteMaps.requiresMap) {
    checkPrerequisites(
      prereqRelationship[0],
      prereqRelationship[1],
      eligibleIncentives,
      ineligibleIncentives,
      prerequisiteMaps.requiredByMap,
    );
  }

  const eligibleTransformed = transformItems(eligibleIncentives, true);
  const ineligibleTransformed = transformItems(ineligibleIncentives, false);
  const stateIncentives = [...eligibleTransformed, ...ineligibleTransformed];

  const savings: APISavings = zeroSavings();

  stateIncentives.forEach(item => {
    const amount = item.amount.representative
      ? item.amount.representative
      : item.amount.type === AmountType.DollarAmount
      ? item.amount.number
      : 0;

    savings[item.type] += amount;
  });

  return {
    stateIncentives,
    savings,
    coverage: {
      state: stateId,
      utility: request.utility ?? null,
    },
  };
}

/* Uses relationships object to build two maps:
- one from incentive ID to an array of IDs of incentives it requires (requiresMap),
- one from incentive ID to an array of IDs of incentives that require it (requiredByMap)
*/
function buildPrerequisiteMaps(incentiveRelationships: IncentiveRelationships) {
  const requiresMap = new Map<string, string[]>();
  const requiredByMap = new Map<string, string[]>();
  if (
    incentiveRelationships != undefined &&
    incentiveRelationships.prerequisites != undefined
  ) {
    for (const relationship of incentiveRelationships.prerequisites) {
      const requiredIncentives = relationship.requires;
      requiresMap.set(relationship.id, requiredIncentives);

      for (const requiredIncentiveId of requiredIncentives) {
        const existingDependencies = requiredByMap.get(requiredIncentiveId);
        if (existingDependencies != undefined) {
          existingDependencies.push(relationship.id);
        } else {
          requiredByMap.set(requiredIncentiveId, [relationship.id]);
        }
      }
    }
  }
  return { requiresMap, requiredByMap };
}

function checkPrerequisites(
  incentiveId: string,
  prerequisiteIds: string[],
  eligibleIncentives: Map<string, StateIncentive>,
  ineligibleIncentives: Map<string, StateIncentive>,
  dependencyMap: Map<string, string[]>,
) {
  for (const prerequisiteId of prerequisiteIds) {
    if (
      eligibleIncentives.has(incentiveId) &&
      !eligibleIncentives.has(prerequisiteId)
    ) {
      const incentive = eligibleIncentives.get(incentiveId);
      if (incentive != undefined) {
        eligibleIncentives.delete(incentiveId);
        ineligibleIncentives.set(incentiveId, incentive);
        checkDependencies(
          incentiveId,
          dependencyMap,
          eligibleIncentives,
          ineligibleIncentives,
        );
        // TODO: also need to check supersedes map when mutual exclusion relationships are implemented.
      }
    }
  }
}

function checkDependencies(
  incentiveId: string,
  dependencyMap: Map<string, string[]>,
  eligibleIncentives: Map<string, StateIncentive>,
  ineligibleIncentives: Map<string, StateIncentive>,
) {
  const dependencyIds = dependencyMap.get(incentiveId);
  if (dependencyIds != undefined) {
    for (const dependencyId of dependencyIds) {
      console.log(dependencyId);
      const dependency = eligibleIncentives.get(dependencyId);
      if (dependency != undefined) {
        eligibleIncentives.delete(dependencyId);
        ineligibleIncentives.set(dependencyId, dependency);
        checkDependencies(
          dependencyId,
          dependencyMap,
          eligibleIncentives,
          ineligibleIncentives,
        );
      }
    }
  }
}

function transformItems(
  incentives: Map<string, StateIncentive>,
  eligible: boolean,
) {
  const transformed = [];
  for (const item of incentives.values()) {
    const transformedItem = {
      ...item,
      eligible,

      // Fill in fields expected for IRA incentive.
      // TODO: don't require these on APIIncentive
      agi_max_limit: null,
      ami_qualification: null,
      filing_status: null,

      // TODO: unclear whether state/utility incentives always have defined
      // end dates.
      start_date: 2023,
      end_date: 2024,
    };
    transformed.push(transformedItem);
  }
  return transformed;
}
