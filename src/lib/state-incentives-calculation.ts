import { min } from 'lodash';
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
import {
  CombinedValue,
  RelationshipMaps,
  buildExclusionMaps,
  buildPrerequisiteMaps,
  getCombinedMaximums,
  isExcluded,
  makeIneligible,
  meetsPrerequisites,
} from './incentive-relationship-calculation';
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
  return INCENTIVE_RELATIONSHIPS_BY_STATE[stateId] ?? {};
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

    if (item.authority_type === AuthorityType.Local) {
      // TODO: support serving Local incentives
      // This allows keeping them in our JSON datasets, but for now
      // we always ignore them.
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

  // We'll create a map from incentive ID to an object storing the remaining
  // value for its incentive grouping (if it has one).
  let groupedIncentives = new Map<string, CombinedValue>();

  if (incentiveRelationships !== undefined) {
    const prerequisiteMaps = buildPrerequisiteMaps(incentiveRelationships);
    const exclusionMaps = buildExclusionMaps(incentiveRelationships);
    const maps: RelationshipMaps = {
      eligibleIncentives: eligibleIncentives,
      ineligibleIncentives: ineligibleIncentives,
      requiresMap: prerequisiteMaps.requiresMap,
      requiredByMap: prerequisiteMaps.requiredByMap,
      supersedesMap: exclusionMaps.supersedesMap,
      supersededByMap: exclusionMaps.supersededByMap,
    };

    // Use relationship maps to update incentive eligibility.
    for (const [incentiveId] of prerequisiteMaps.requiresMap) {
      if (!meetsPrerequisites(incentiveId, maps)) {
        makeIneligible(incentiveId, maps);
      }
    }
    for (const [incentiveId] of exclusionMaps.supersededByMap) {
      if (isExcluded(incentiveId, maps)) {
        makeIneligible(incentiveId, maps);
      }
    }

    // Now that we know final eligibility, enforce combined maximum values.
    groupedIncentives = getCombinedMaximums(incentiveRelationships);
  }

  const eligibleTransformed = transformItems(eligibleIncentives, true);
  const ineligibleTransformed = transformItems(ineligibleIncentives, false);
  const stateIncentives = [...eligibleTransformed, ...ineligibleTransformed];

  const savings: APISavings = zeroSavings();
  eligibleTransformed.forEach(item => {
    let amount = item.amount.representative
      ? item.amount.representative
      : item.amount.type === AmountType.DollarAmount
      ? item.amount.number
      : 0;
    // Check any incentive groupings for this item to make sure it has remaining eligible value.
    if (groupedIncentives.has(item.id)) {
      const combinedValue = groupedIncentives.get(item.id)!;
      amount = min([amount, combinedValue.remainingValue])!;
      combinedValue.remainingValue -= amount;
    }

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
