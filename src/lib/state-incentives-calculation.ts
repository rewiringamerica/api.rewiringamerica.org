import { RI_LOW_INCOME_THRESHOLDS_BY_AUTHORITY } from '../data/RI/low_income_thresholds';
import { AUTHORITIES_BY_STATE, AuthorityType } from '../data/authorities';
import { RI_INCENTIVES } from '../data/state_incentives';
import { AmountType } from '../data/types/amount';
import { OwnerStatus } from '../data/types/owner-status';
import { APISavings, zeroSavings } from '../schemas/v1/savings';
import { CalculateParams, CalculatedIncentive } from './incentives-calculation';

export function calculateStateIncentivesAndSavings(
  stateId: string,
  request: CalculateParams,
): {
  stateIncentives: CalculatedIncentive[];
  savings: APISavings;
} {
  // TODO condition based on existence of incentives data, not hardcoding RI.
  if (stateId !== 'RI') {
    return { stateIncentives: [], savings: zeroSavings() };
  }

  const incentives = RI_INCENTIVES;
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

    let authority_thresholds =
      RI_LOW_INCOME_THRESHOLDS_BY_AUTHORITY[item.authority];
    if (authority_thresholds === undefined) {
      authority_thresholds = RI_LOW_INCOME_THRESHOLDS_BY_AUTHORITY['default'];
    }
    if (
      item.low_income &&
      request.household_income > authority_thresholds[request.household_size]
    ) {
      eligible = false;
    }

    const authority_name =
      item.authority_type === AuthorityType.State
        ? AUTHORITIES_BY_STATE[stateId].state[item.authority].name
        : item.authority_type === AuthorityType.Utility
        ? AUTHORITIES_BY_STATE[stateId].utility[item.authority].name
        : null;

    const transformedItem = {
      ...item,
      authority_name,
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
  };
}
