import { LocalDate, ZoneId } from '@js-joda/core';
import '@js-joda/timezone';
import _, { min } from 'lodash';
import { AuthoritiesByType, AuthorityType } from '../data/authorities';
import { DATA_PARTNERS_BY_STATE } from '../data/data_partners';
import { GEO_GROUPS_BY_STATE } from '../data/geo_groups';
import { LOW_INCOME_THRESHOLDS } from '../data/low_income_thresholds';
import { Programs } from '../data/programs';
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
import { PaymentMethod } from '../data/types/incentive-types';
import { OwnerStatus } from '../data/types/owner-status';
import { Program } from '../data/types/program';
import { APISavings, zeroSavings } from '../schemas/v1/savings';
import { AMIAndEVCreditEligibility } from './ami-evcredit-calculation';
import { lastDayOf } from './dates';
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
import { applyMassSaveRule } from './mass-save';
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
  allPrograms: Programs,
  amiAndEvCreditEligibility: AMIAndEVCreditEligibility,
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

  // Get state tax owed to determine max potential tax savings and filter out
  // tax credits if no tax liability. Don't compute tax if we don't have
  // filing status.
  const stateTaxOwed = request.tax_filing
    ? estimateStateTaxAmount(
        request.household_income,
        request.tax_filing,
        stateId,
      )
    : null;

  // Separate the state's incentive set into eligible and ineligible ones, based
  // on criteria that reflect real-life eligibility rules.
  //
  // That is, don't yet filter on criteria like authority type, which are purely
  // of interest to the API, not to real-life rules. (Nobody is categorically
  // ineligible for all but state-government incentives, for example.)
  for (const incentive of incentives) {
    const program = allPrograms[incentive.program];
    let eligible = true;

    if (
      ineligibleByLocationOrUtility(
        incentive,
        program,
        stateAuthorities,
        request,
        location,
      )
    ) {
      eligible = false;
    }

    if (!incentive.owner_status.includes(request.owner_status as OwnerStatus)) {
      eligible = false;
    }

    // Filter out incentives that are only payable as a tax credit, if we were
    // able to compute the user's state tax liability and it's zero
    if (
      _.isEqual(incentive.payment_methods, [PaymentMethod.TaxCredit]) &&
      stateTaxOwed?.taxOwed === 0
    ) {
      eligible = false;
    }

    if (incentive.low_income) {
      const thresholds = LOW_INCOME_THRESHOLDS[incentive.low_income];
      if (!thresholds) {
        console.log(`No income thresholds defined for ${incentive.low_income}`);
        // The incentive is income-qualified but we don't know the thresholds;
        // be conservative and exclude it.
        eligible = false;
      } else if (
        !isLowIncome(request, thresholds, location, amiAndEvCreditEligibility)
      ) {
        eligible = false;
      }
    }

    if (incentive.end_date) {
      const lastValidDay = lastDayOf(incentive.end_date);
      if (getCurrentDate().isAfter(lastValidDay)) {
        eligible = false;
      }
    }

    if (eligible) {
      eligibleIncentives.set(incentive.id, incentive);
    } else {
      ineligibleIncentives.set(incentive.id, incentive);
    }
  }

  // The Mass Save rule is essentially a bespoke set of exclusion relationships.
  // Apply those here, just before general relationship solving.
  if (location.state === 'MA') {
    applyMassSaveRule(eligibleIncentives, ineligibleIncentives, allPrograms);
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

  const stateIncentives = [];

  for (const incentive of eligibleIncentives.values()) {
    const program = allPrograms[incentive.program];
    const requestItems = request.items;
    const exclude =
      (!!request.authority_types &&
        !request.authority_types.includes(program.authority_type)) ||
      // Don't include an incentive at all if the query is filtering by item and
      // this incentive's items don't overlap
      (!!requestItems &&
        incentive.items.every(item => !requestItems.includes(item)));

    if (!exclude) {
      stateIncentives.push({ ...incentive, eligible: true });
    }
  }

  const savings: APISavings = zeroSavings();
  stateIncentives.forEach(item => {
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

function ineligibleByLocationOrUtility(
  incentive: StateIncentive,
  program: Program,
  stateAuthorities: AuthoritiesByType,
  request: CalculateParams,
  location: ResolvedLocation,
): boolean {
  if (
    program.authority_type === AuthorityType.Utility &&
    program.authority !== request.utility
  ) {
    // Don't include utility incentives at all if they weren't requested, or
    // if they're for the wrong utility.
    return true;
  }

  if (
    program.authority_type === AuthorityType.GasUtility &&
    program.authority !== request.gas_utility
  ) {
    return true;
  }

  const authority =
    stateAuthorities[program.authority_type][program.authority!];

  if (authority.geography_id) {
    // One of the resolved location's geographies must match the authority's
    // geography. This is permissive: the user's location is not guaranteed to
    // be within any one of the resolved geographies. For example, they may have
    // entered a ZIP code which only partially overlaps with a county.
    if (!location.geographies.map(g => g.id).includes(authority.geography_id)) {
      return true;
    }
  }

  if (incentive.eligible_geo_group) {
    // A test ensures that geo groups are registered.
    const group =
      GEO_GROUPS_BY_STATE[location.state]![incentive.eligible_geo_group];

    // The request params must match ANY of the geo group's member authorities
    const matchesUtility =
      group.utilities &&
      request.utility &&
      group.utilities.includes(request.utility);
    const matchesGasUtility =
      group.gas_utilities &&
      request.gas_utility &&
      group.gas_utilities.includes(request.gas_utility);

    const groupGeographyIds = [
      ...(group.cities?.map(id => stateAuthorities.city[id]) || []),
      ...(group.counties?.map(id => stateAuthorities.county[id]) || []),
    ]
      .map(authority => authority.geography_id)
      .filter(id => id !== undefined);

    // This is permissive: the user's location is not guaranteed to be within
    // any particular one of the resolved location's geographies.
    const matchesGeography = location.geographies.some(g =>
      groupGeographyIds.includes(g.id),
    );

    if (!matchesUtility && !matchesGasUtility && !matchesGeography) {
      return true;
    }
  }

  if (
    program.authority_type !== AuthorityType.Utility &&
    program.authority_type !== AuthorityType.GasUtility &&
    !authority.geography_id &&
    !incentive.eligible_geo_group
  ) {
    // Unit tests make sure this doesn't happen
    console.error(`Non-utility incentive with no geography: ${incentive.id}`);
    return true;
  }

  return false;
}

function getCurrentDate() {
  // Use static date for snapshot tests
  if (process.env.STATIC_DATE) {
    return LocalDate.parse(process.env.STATIC_DATE);
  }

  // Use the current day in Eastern time, the earliest timezone of the
  // mainland US. This is conservative: when it's 2025-01-01 at 1am in
  // Eastern time, it will still be 2024 in Pacific time, but incentives
  // whose validity ends on 2024-12-31 will be counted as ineligible
  // everywhere.
  //
  // One possible improvement would be to infer the user's timezone from
  // their passed-in location, but that would be a lot of effort for fairly
  // marginal gain.
  return LocalDate.now(ZoneId.of('America/New_York'));
}
