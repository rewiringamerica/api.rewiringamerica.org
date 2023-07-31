import { RI_LOW_INCOME_THRESHOLDS } from '../data/RI/low_income_thresholds.js';
import { AUTHORITIES_BY_STATE, AuthorityType } from '../data/authorities.js';
import { Incentive, OwnerStatus } from '../data/ira_incentives.js';
import { RI_INCENTIVES } from '../data/state_incentives.js';
import { APICalculatorRequest } from '../schemas/v1/calculator-endpoint.js';

export function calculateStateIncentivesAndSavings(
  stateId: string,
  request: APICalculatorRequest,
): {
  stateIncentives: (Incentive & { eligible: boolean })[];
  tax_savings: number;
  pos_savings: number;
  performance_rebate_savings: number;
} {
  // TODO not like this
  const incentives = RI_INCENTIVES;

  const eligibleIncentives = [];
  const ineligibleIncentives = [];

  for (const item of incentives) {
    if (
      item.authority_type === 'state' &&
      !request.authority_types?.includes(AuthorityType.State)
    ) {
      // Don't include state incentives at all if they weren't requested, not
      // even as "ineligible" incentives.
      continue;
    }

    if (
      item.authority_type === 'utility' &&
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

    let agi_max_limit = null;
    if (
      item.low_income &&
      request.household_income >
        RI_LOW_INCOME_THRESHOLDS[request.household_size]
    ) {
      agi_max_limit = RI_LOW_INCOME_THRESHOLDS[request.household_size];
      eligible = false;
    }

    const authority_name =
      item.authority_type === 'state'
        ? AUTHORITIES_BY_STATE[stateId].state[item.authority]
        : item.authority_type === 'utility'
        ? AUTHORITIES_BY_STATE[stateId].utility[item.authority]
        : null;

    const transformedItem = {
      ...item,
      authority_name,
      agi_max_limit,
      eligible,
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
    if (item.item_type === 'pos_rebate') {
      if (item.amount.representative) {
        savings += item.amount.representative;
      } else if (item.amount.type === 'dollar_amount' && item.amount.number) {
        savings += item.amount.number;
      }
    }
  });

  return {
    stateIncentives: [],
    tax_savings: 0,
    pos_savings: savings,
    performance_rebate_savings: 0,
  };
}
