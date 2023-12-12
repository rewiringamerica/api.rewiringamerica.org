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
import { isStateIncluded } from '../data/types/states';
import { APISavings, zeroSavings } from '../schemas/v1/savings';
import { CalculateParams, CalculatedIncentive } from './incentives-calculation';

export function getAllStateIncentives(
  stateId: string,
  request: CalculateParams,
) {
  // Only process incentives for launched states, or beta states if beta was requested.
  if (!isStateIncluded(stateId, request.include_beta_states ?? false)) {
    return [];
  }
  return STATE_INCENTIVES_BY_STATE[stateId];
}

export function getStateIncentiveRelationships(stateId: string) {
  return INCENTIVE_RELATIONSHIPS_BY_STATE[stateId];
}

export function calculateStateIncentivesAndSavings(
  stateId: string,
  request: CalculateParams,
  incentives: StateIncentive[],
  incentiveRelationships: IncentiveRelationships,
): {
  stateIncentives: CalculatedIncentive[];
  savings: APISavings;
  coverage: APICoverage;
} {
  if (incentives.length === 0) {
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

  if (incentiveRelationships !== undefined) {
    const prerequisiteMaps = buildPrerequisiteMaps(incentiveRelationships);

    // Use relationship maps to update incentive eligibility.
    for (const [incentiveId, prerequisiteIds] of prerequisiteMaps.requiresMap) {
      checkPrerequisites(
        incentiveId,
        prerequisiteIds,
        eligibleIncentives,
        ineligibleIncentives,
        prerequisiteMaps.requiredByMap,
      );
    }
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
- one from incentive ID to a set of IDs of incentives it requires (requiresMap),
- one from incentive ID to a set of IDs of incentives that require it (requiredByMap)
*/
export function buildPrerequisiteMaps(
  incentiveRelationships: IncentiveRelationships,
) {
  const requiresMap = new Map<string, Set<string>>();
  const requiredByMap = new Map<string, Set<string>>();
  if (incentiveRelationships.prerequisites !== undefined) {
    for (const [incentiveId, prerequisiteIds] of Object.entries(
      incentiveRelationships.prerequisites,
    )) {
      requiresMap.set(incentiveId, new Set(prerequisiteIds));

      for (const prerequisiteId of prerequisiteIds) {
        const existingDependencies = requiredByMap.get(prerequisiteId);
        if (existingDependencies !== undefined) {
          existingDependencies.add(incentiveId);
        } else {
          requiredByMap.set(prerequisiteId, new Set(incentiveId));
        }
      }
    }
  }
  return { requiresMap, requiredByMap };
}

// Builds a graph of incentive relationships, represented as pairs of incentive
// ID and the set of IDs of incentives that are dependent on that incentive.
export function buildRelationshipGraph(data: IncentiveRelationships) {
  const edges = new Map<string, Set<string>>();
  // For exclusion relationships, the superseding incentive is the "source."
  if (data.exclusions !== undefined) {
    for (const [incentiveId, supersededIds] of Object.entries(
      data.exclusions,
    )) {
      edges.set(incentiveId, new Set(supersededIds));
    }
  }

  // For prerequisite relationships, the required incentive is the "source."
  if (data.prerequisites !== undefined) {
    for (const [incentiveId, requiredByIds] of buildPrerequisiteMaps(data)
      .requiredByMap) {
      const existingRelationships = edges.get(incentiveId);
      if (existingRelationships !== undefined) {
        for (const requiredById of requiredByIds) {
          existingRelationships.add(requiredById);
        }
      } else {
        edges.set(incentiveId, new Set(requiredByIds));
      }
    }
  }
  return edges;
}

/* Checks the prerequisites for a single incentive and updates its eligibility
   accordingly.
   If the user is not eligible for a prerequisite incentive, this incentive is
   removed from the eligible incentives, and then we check any incentives that
   require this one.
*/
function checkPrerequisites(
  incentiveId: string,
  prerequisiteIds: Set<string>,
  eligibleIncentives: Map<string, StateIncentive>,
  ineligibleIncentives: Map<string, StateIncentive>,
  dependentsMap: Map<string, Set<string>>,
) {
  for (const prerequisiteId of prerequisiteIds) {
    if (
      eligibleIncentives.has(incentiveId) &&
      !eligibleIncentives.has(prerequisiteId)
    ) {
      makeIneligible(
        eligibleIncentives.get(incentiveId)!,
        eligibleIncentives,
        ineligibleIncentives,
        dependentsMap,
      );
    }
  }
}

// Switches an incentive from eligible to ineligible and checks dependencies.
function makeIneligible(
  incentive: StateIncentive,
  eligibleIncentives: Map<string, StateIncentive>,
  ineligibleIncentives: Map<string, StateIncentive>,
  dependentsMap: Map<string, Set<string>>,
) {
  eligibleIncentives.delete(incentive.id);
  ineligibleIncentives.set(incentive.id, incentive);
  const dependentIds = dependentsMap.get(incentive.id);
  if (dependentIds !== undefined) {
    for (const dependentId of dependentIds) {
      const dependent = eligibleIncentives.get(dependentId);
      if (dependent !== undefined) {
        makeIneligible(
          dependent,
          eligibleIncentives,
          ineligibleIncentives,
          dependentsMap,
        );
      }
    }
  }
  // TODO: also need to check supersedes map when mutual exclusion relationships are implemented.
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
