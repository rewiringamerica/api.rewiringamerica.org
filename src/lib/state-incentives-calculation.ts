import { RI_LOW_INCOME_THRESHOLDS } from '../data/RI/low_income_thresholds.js';
import { AUTHORITIES_BY_STATE, AuthorityType } from '../data/authorities.js';
import { AmountType, OwnerStatus, Type } from '../data/ira_incentives.js';
import { RI_INCENTIVES } from '../data/state_incentives.js';
import { APICalculatorRequest } from '../schemas/v1/calculator-endpoint.js';
import { APIIncentiveMinusItemUrl } from '../schemas/v1/incentive.js';

export function calculateStateIncentivesAndSavings(
  stateId: string,
  request: APICalculatorRequest,
): {
  stateIncentives: APIIncentiveMinusItemUrl[];
  tax_savings: number;
  pos_savings: number;
  performance_rebate_savings: number;
} {
  // TODO not like this
  if (stateId !== 'RI') {
    throw new Error("We don't have coverage in that state yet.");
  }

  const incentives = RI_INCENTIVES;

  const eligibleIncentives = [];
  const ineligibleIncentives = [];

  for (const item of incentives) {
    if (request.items && !request.items.includes(item.item)) {
      // Don't include an incentive at all if the query is filtering by item and
      // this doesn't match.
      continue;
    }

    if (
      item.authority_type === AuthorityType.State &&
      !request.authority_types?.includes(AuthorityType.State)
    ) {
      // Don't include state incentives at all if they weren't requested, not
      // even as "ineligible" incentives.
      continue;
    }

    if (
      item.authority_type === AuthorityType.Utility &&
      (!request.authority_types?.includes(AuthorityType.Utility) ||
        item.authority !== request.utility)
    ) {
      // Don't include utility incentives at all if they weren't requested, or
      // if they're for the wrong utility.
      continue;
    }

    let eligible = true;

    if (!item.owner_status.includes(request.owner_status as OwnerStatus)) {
      eligible = false;
    }

    if (
      item.low_income &&
      request.household_income >
        RI_LOW_INCOME_THRESHOLDS[request.household_size]
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

  let savings = 0;

  stateIncentives.forEach(item => {
    if (item.type === Type.PosRebate) {
      if (item.amount.representative) {
        savings += item.amount.representative;
      } else if (item.amount.type === AmountType.DollarAmount) {
        savings += item.amount.number;
      }
    }
  });

  return {
    stateIncentives,
    tax_savings: 0,
    pos_savings: savings,
    performance_rebate_savings: 0,
  };
}
