import { min } from 'lodash';
import { AuthoritiesByType, AuthorityType } from '../data/authorities';
import { DATA_PARTNERS_BY_STATE } from '../data/data_partners';
import { GEO_GROUPS_BY_STATE } from '../data/geo_groups';
import { LOW_INCOME_THRESHOLDS_BY_STATE } from '../data/low_income_thresholds';
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
import { ResolvedLocation } from './location';
import { isLowIncome } from './low-income';
import { isStateIncluded } from './states';
import { estimateStateTaxAmount } from './tax-brackets';

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

export function getStateDataPartners(
  stateId: string,
  request: CalculateParams,
) {
  // Only process state data partners for launched states, or beta states if beta was requested.
  if (!isStateIncluded(stateId, request.include_beta_states ?? false)) {
    return {};
  }
  return DATA_PARTNERS_BY_STATE[stateId] || {};
}

export function calculateStateIncentivesAndSavings(
  location: ResolvedLocation,
  request: CalculateParams,
  incentives: StateIncentive[],
  incentiveRelationships: IncentiveRelationships,
  stateAuthorities: AuthoritiesByType,
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

  const stateId = location.state;
  const eligibleIncentives = new Map<string, StateIncentive>();
  const ineligibleIncentives = new Map<string, StateIncentive>();

  for (const item of incentives) {
    if (skipBasedOnRequestParams(item, request, location, stateAuthorities)) {
      continue;
    }

    let eligible = true;

    if (!item.owner_status.includes(request.owner_status as OwnerStatus)) {
      eligible = false;
    }

    if (item.low_income) {
      const thresholds =
        LOW_INCOME_THRESHOLDS_BY_STATE[stateId]?.[item.low_income];
      if (!thresholds) {
        console.log(
          `No income thresholds defined for ${item.low_income} in ${stateId}`,
        );
        // The incentive is income-qualified but we don't know the thresholds;
        // be conservative and exclude it.
        eligible = false;
      } else if (!isLowIncome(request, thresholds, location)) {
        eligible = false;
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
      // Any incentives which were ineligible before checking relationships
      // must remain ineligible.
      permanentlyIneligibleIncentives: new Set(ineligibleIncentives.keys()),
      requiresMap: prerequisiteMaps.requiresMap,
      requiredByMap: prerequisiteMaps.requiredByMap,
      structuredPrerequisitesMap: prerequisiteMaps.structuredPrerequisitesMap,
      supersedesMap: exclusionMaps.supersedesMap,
      supersededByMap: exclusionMaps.supersededByMap,
    };

    // Use relationship maps to update incentive eligibility.
    for (const [incentiveId] of prerequisiteMaps.requiresMap) {
      if (
        eligibleIncentives.has(incentiveId) &&
        !meetsPrerequisites(incentiveId, maps)
      ) {
        makeIneligible(incentiveId, maps);
      }
    }
    for (const [incentiveId] of exclusionMaps.supersededByMap) {
      if (
        eligibleIncentives.has(incentiveId) &&
        isExcluded(incentiveId, maps)
      ) {
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

    savings[item.payment_methods[0]] += amount;
  });

  // Get state tax owed to determine max potential tax savings
  const stateTaxOwed = estimateStateTaxAmount(
    request.household_income,
    stateId,
  );

  // You can't save more than tax owed. Choose the lesser of state tax owed vs tax credit savings
  savings.tax_credit = stateTaxOwed
    ? Math.min(stateTaxOwed.taxOwed, savings.tax_credit)
    : savings.tax_credit;

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
      ami_qualification: null,
    };
    transformed.push(transformedItem);
  }
  return transformed;
}

function skipBasedOnRequestParams(
  incentive: StateIncentive,
  request: CalculateParams,
  location: ResolvedLocation,
  stateAuthorities: AuthoritiesByType,
) {
  if (
    request.authority_types &&
    !request.authority_types.includes(incentive.authority_type)
  ) {
    // Skip all utilities that are not of the requested authority type(s).
    return true;
  }

  if (request.items) {
    const requestItems = request.items;
    if (incentive.items.every(item => !requestItems.includes(item))) {
      // Don't include an incentive at all if the query is filtering by item and
      // this incentive's items don't overlap
      return true;
    }
  }

  if (
    incentive.authority_type === AuthorityType.Utility &&
    incentive.authority !== request.utility
  ) {
    // Don't include utility incentives at all if they weren't requested, or
    // if they're for the wrong utility.
    return true;
  }

  // County and City incentives are approximate and prone to
  // false positives, since zip codes to not map 1:1 to counties
  // and cities.
  // https://app.asana.com/0/1204738794846444/1206454407609847
  // tracks long-term work in this space.
  if (incentive.authority_type === AuthorityType.County) {
    // Skip if we didn't get location data.
    if (location.countyFips === undefined) {
      return true;
    }

    // We have tests to ensure county authorities are registered.
    const authorityDetails = stateAuthorities.county![incentive.authority];
    if (authorityDetails.county_fips !== location.countyFips) {
      return true;
    }
  }

  if (incentive.authority_type === AuthorityType.City) {
    // We have to match on both city and county since more than one
    // municipalities can have the same name within the same state.

    // Skip if we didn't get location data.
    if (location.city === undefined || location.countyFips === undefined) {
      return true;
    }

    // We have tests to ensure city authorities are registered.
    const authorityDetails = stateAuthorities.city![incentive.authority];

    if (
      authorityDetails.city !== location.city ||
      authorityDetails.county_fips !== location.countyFips
    ) {
      return true;
    }
  }

  if (incentive.eligible_geo_group) {
    // A test ensures that geo groups are registered.
    const group =
      GEO_GROUPS_BY_STATE[location.state]![incentive.eligible_geo_group];

    // The request params must match ALL of the keys the geo group defines
    if (
      (group.utilities &&
        (!request.utility || !group.utilities.includes(request.utility))) ||
      (group.counties &&
        (!location.countyFips ||
          !group.counties
            .map(id => stateAuthorities.county[id].county_fips)
            .includes(location.countyFips))) ||
      (group.cities &&
        (!location.city ||
          !group.cities
            .map(id => stateAuthorities.city[id].city)
            .includes(location.city)))
    ) {
      return true;
    }
  }

  return false;
}
