import { AuthorityType } from '../data/authorities';
import { CT_LOW_INCOME_THRESHOLDS_BY_AUTHORITY } from '../data/CT/low_income_thresholds';
import { NY_LOW_INCOME_THRESHOLDS_BY_AUTHORITY } from '../data/NY/low_income_thresholds';
import { RI_LOW_INCOME_THRESHOLDS_BY_AUTHORITY } from '../data/RI/low_income_thresholds';
import { STATE_INCENTIVES_BY_STATE } from '../data/state_incentives';
import { AmountType } from '../data/types/amount';
import { APICoverage } from '../data/types/coverage';
import { OwnerStatus } from '../data/types/owner-status';
import { BETA_STATES, LAUNCHED_STATES } from '../data/types/states';
import { APISavings, zeroSavings } from '../schemas/v1/savings';
import { CalculatedIncentive, CalculateParams } from './incentives-calculation';

export function calculateStateIncentivesAndSavings(
  stateId: string,
  request: CalculateParams,
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

  const incentives = STATE_INCENTIVES_BY_STATE[stateId];
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

    // TODO: Replace per-state logic with an index into income thresholds map.
    // See https://app.asana.com/0/1204738794846444/1205784001056408/f
    let thresholds_map;
    switch (stateId) {
      case 'CT':
        thresholds_map = CT_LOW_INCOME_THRESHOLDS_BY_AUTHORITY;
        break;
      case 'NY':
        thresholds_map = NY_LOW_INCOME_THRESHOLDS_BY_AUTHORITY;
        break;
      case 'RI':
        thresholds_map = RI_LOW_INCOME_THRESHOLDS_BY_AUTHORITY;
        break;
      default:
        console.log('No income thresholds defined for ', stateId);
    }

    if (typeof thresholds_map !== 'undefined') {
      const authority_thresholds =
        thresholds_map[item.authority] ?? thresholds_map.default;
      if (
        item.low_income &&
        request.household_income > authority_thresholds[request.household_size]
      ) {
        eligible = false;
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
