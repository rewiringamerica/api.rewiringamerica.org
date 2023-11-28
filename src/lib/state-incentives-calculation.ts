import { AuthorityType } from '../data/authorities';
import { LOW_INCOME_THRESHOLDS_BY_AUTHORITY } from '../data/low_income_thresholds';
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

export function calculateStateIncentivesAndSavings(
  stateId: string,
  request: CalculateParams,
  testIncentives?: StateIncentive[],
): {
  stateIncentives: CalculatedIncentive[];
  savings: APISavings;
  coverage: APICoverage;
} {
  // Only process incentives for launched states, or beta states if beta was requested.
  if (
    !LAUNCHED_STATES.includes(stateId) &&
    (!request.include_beta_states || !BETA_STATES.includes(stateId))
  ) {
    return {
      stateIncentives: [],
      savings: zeroSavings(),
      coverage: { state: null, utility: null },
    };
  }

  // If test incentives were supplied, use those instead of the real ones.
  const incentives = testIncentives
    ? testIncentives
    : STATE_INCENTIVES_BY_STATE[stateId];
  const includeState =
    !request.authority_types ||
    request.authority_types.includes(AuthorityType.State);
  const includeUtility =
    !request.authority_types ||
    request.authority_types.includes(AuthorityType.Utility);

  const eligibleIncentives = [];
  const ineligibleIncentives = [];

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
    if (eligible) {
      eligibleIncentives.push(transformedItem);
    } else {
      ineligibleIncentives.push(transformedItem);
    }
  }

  const stateIncentives = [...eligibleIncentives, ...ineligibleIncentives];

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
