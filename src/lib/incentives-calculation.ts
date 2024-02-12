import _ from 'lodash';
import {
  AUTHORITIES_BY_STATE,
  AuthoritiesById,
  AuthorityType,
} from '../data/authorities';
import { IRAIncentive, IRA_INCENTIVES } from '../data/ira_incentives';
import { SOLAR_PRICES } from '../data/solar_prices';
import { StateIncentive } from '../data/state_incentives';
import { STATE_MFIS, StateMFI } from '../data/state_mfi';
import { FilingStatus } from '../data/tax_brackets';
import { APICoverage } from '../data/types/coverage';
import { PaymentMethod } from '../data/types/incentive-types';
import { OwnerStatus } from '../data/types/owner-status';
import {
  APICalculatorRequest,
  APICalculatorResponse,
} from '../schemas/v1/calculator-endpoint';
import { APISavings, addSavings, zeroSavings } from '../schemas/v1/savings';
import { InvalidInputError, UnexpectedInputError } from './error';
import { AMI, CompleteIncomeInfo, GeoInfo, MFI } from './income-info';
import {
  calculateStateIncentivesAndSavings,
  getAllStateIncentives,
  getStateIncentiveRelationships,
} from './state-incentives-calculation';
import estimateTaxAmount from './tax-brackets';

const MAX_POS_SAVINGS = 14000;
const OWNER_STATUSES = new Set(Object.values(OwnerStatus));
const TAX_FILINGS = new Set(Object.values(FilingStatus));

IRA_INCENTIVES.forEach(incentive => Object.freeze(incentive));

function roundCents(dollars: number): number {
  return Math.round(dollars * 100) / 100;
}

export type CalculatedIncentive = (IRAIncentive | StateIncentive) & {
  eligible?: boolean;
};

/**
 * calculateIncentives() returns something that is almost the API response
 * object, but with incentives in a format closer to the static JSON format.
 * Replace the type of the "incentives" property.
 */
type CalculatedIncentives = Omit<APICalculatorResponse, 'incentives'> & {
  incentives: CalculatedIncentive[];
  savings: APISavings;
};

export type CalculateParams = Omit<APICalculatorRequest, 'location'>;
export type LocationParams = Omit<GeoInfo, 'zip'>;

function calculateFederalIncentivesAndSavings(
  ami: AMI,
  calculations: MFI,
  stateMFI: StateMFI,
  solarSystemCost: number,
  {
    tax_filing,
    owner_status,
    household_income,
    household_size,
    items,
  }: CalculateParams,
): {
  federalIncentives: CalculatedIncentive[];
  savings: APISavings;
} {
  const eligibleIncentives: CalculatedIncentive[] = [];
  const ineligibleIncentives: CalculatedIncentive[] = [];

  // Loop through each of the incentives, running several tests to see if visitor is eligible
  for (const item of IRA_INCENTIVES) {
    let eligible = true;

    // Don't include an incentive at all if the query is filtering by item and
    // this doesn't match.
    if (items && !items.includes(item.item)) {
      continue;
    }

    //
    // 1) Verify that the selected homeowner status qualifies
    //
    if (!item.owner_status.includes(owner_status as OwnerStatus)) {
      eligible = false;
    }

    //
    // 2) Verify that the given income falls within defined AMI limits, if defined
    //
    if (item.ami_qualification) {
      if (
        (item.ami_qualification === 'less_than_80_ami' &&
          household_income >= Number(ami[`l80_${household_size}`])) ||
        (item.ami_qualification === 'more_than_80_ami' &&
          household_income < Number(ami[`l80_${household_size}`])) ||
        (item.ami_qualification === 'less_than_150_ami' &&
          (household_income < Number(ami[`l80_${household_size}`]) ||
            household_income >= Number(ami[`l150_${household_size}`])))
      ) {
        eligible = false;
      }
    }

    //
    // 3) Verify that overall income limits not exceeded
    //
    if (item.agi_max_limit) {
      if (Number(household_income) >= Number(item.agi_max_limit)) {
        eligible = false;
      }
    }

    //
    // 4) Verify tax filing status is eligible for benfit
    //
    if (item.filing_status) {
      if (item.filing_status !== tax_filing) {
        eligible = false;
      }
    }

    //
    // 5) Add the Rooftop Solar Credit amount
    //
    const amount = { ...item.amount };
    if (item.item === 'rooftop_solar_installation') {
      amount.representative = roundCents(solarSystemCost * amount.number!);
    }

    // EV charger credit has some special eligibility rules
    if (item.item === 'electric_vehicle_charger') {
      // console.log(
      //   'EV Charger Qualifications:',
      //   '\nIs Rural?',
      //   !calculations.isUrban,
      //   '\nPoverty rate is greater than or equal to 20%?',
      //   calculations.highestPovertyRate >= 0.2,
      //   '\nNon-metro highest MFI is not greater than 80% state MFI',
      //   ami.metro === '0' && calculations.highestMFI < stateMFI.TOTAL * 0.8,
      //   '\nMetro highest MFI is not greater than 80% state MFI OR highest MFI is not greater than 80% median AMI?',
      //   ami.metro === '1' &&
      //     (calculations.highestMFI < stateMFI.TOTAL * 0.8 ||
      //       calculations.highestMFI < Number(ami.median2022) * 0.8),
      // );

      if (
        !calculations.isUrban ||
        calculations.highestPovertyRate >= 0.2 ||
        (ami.metro === '0' && calculations.highestMFI < stateMFI.TOTAL * 0.8) ||
        (ami.metro === '1' &&
          (calculations.highestMFI < stateMFI.TOTAL * 0.8 ||
            calculations.highestMFI < Number(ami.median2022) * 0.8))
      ) {
        // @TODO: The above logic was inverted to be truthy statements, but the
        // logic for incentives is calculated with true-as-default and needs to be negated
        // so this express should do nothing and the "else" corrects the incentive state
        eligible = true;
      } else {
        eligible = false;
      }
    }

    const newItem = {
      ...item,
      amount,
      eligible,
    };
    if (eligible) {
      eligibleIncentives.push(newItem);
    } else {
      ineligibleIncentives.push(newItem);
    }
  }

  // Remove items in ineligible section that display in eligible section
  const dedupedIneligibleIncentives = _.uniqBy(
    ineligibleIncentives.filter(item => {
      // Note: using _ here because it finds by matching properties, not by equality
      const key = { item: item.item, type: item.type };
      return _.find(eligibleIncentives, key) === undefined;
    }),
    item => item.item + item.type,
  );

  const calculatedIncentives = [
    ...eligibleIncentives,
    ...dedupedIneligibleIncentives,
  ];

  //
  // Loop through every eligible incentive and add any with an "immediate" dollar value
  //
  const savings: APISavings = zeroSavings();

  for (const item of eligibleIncentives) {
    if (item.type === 'pos_rebate') {
      savings.pos_rebate += item.amount.number!;
    } else if (item.type === 'performance_rebate') {
      savings.performance_rebate += item.amount.number!;
    } else if (item.type === 'tax_credit') {
      // if this is a dollar amount, just add it up:
      if (item.amount.type === 'dollar_amount') {
        savings.tax_credit += item.amount.number!;
      } else if (item.amount.representative) {
        // otherwise, it's a percentage. If there's a representative amount, use that:
        savings.tax_credit += item.amount.representative;
      }
    } else {
      throw new UnexpectedInputError(`Unknown item type: ${item.type}`);
    }
  }

  // The max POS savings is $14,000 if you're under 150% ami, otherwise 0
  savings.pos_rebate =
    household_income < Number(ami[`l150_${household_size}`]) &&
    owner_status !== 'renter'
      ? MAX_POS_SAVINGS
      : 0;

  return {
    federalIncentives: calculatedIncentives,
    savings,
  };
}

export default function calculateIncentives(
  { location, ami, calculations }: CompleteIncomeInfo,
  request: CalculateParams,
): CalculatedIncentives {
  const {
    owner_status,
    household_income,
    tax_filing,
    household_size,
    authority_types,
  } = request;

  const state_id = location.state_id;

  if (!OWNER_STATUSES.has(owner_status)) {
    throw new UnexpectedInputError('Unknown owner_status');
  }

  if (!TAX_FILINGS.has(tax_filing)) {
    throw new UnexpectedInputError('Unknown tax_filing.');
  }

  if (
    isNaN(household_income) ||
    household_income < 0 ||
    household_income > 100000000
  ) {
    throw new UnexpectedInputError(
      'Invalid household_income. Must be >= 0 and <= 100000000',
    );
  }

  if (isNaN(household_size) || household_size < 1 || household_size > 8) {
    throw new UnexpectedInputError(
      'Invalid household_size. Must be a number between 1 and 8.',
    );
  }

  const solarSystemCost = SOLAR_PRICES[state_id]?.system_cost;
  const stateMFI = STATE_MFIS[state_id];

  if (isNaN(solarSystemCost) || isNaN(stateMFI?.TOTAL)) {
    throw new InvalidInputError(
      'Invalid state id provided. Must be US state code or DC.',
    );
  }

  // Throw an error if the request specifically asks for utility incentives and
  // doesn't include a utility.
  if (
    authority_types &&
    authority_types.includes(AuthorityType.Utility) &&
    !request.utility
  ) {
    throw new InvalidInputError(
      'Must include the "utility" field when requesting utility incentives.',
      'utility',
    );
  }

  const stateAuthorities = AUTHORITIES_BY_STATE[state_id];
  if (request.utility) {
    if (!stateAuthorities) {
      throw new InvalidInputError(
        `We do not yet have information about the utilities in ${state_id}.`,
        'utility',
      );
    }

    if (!stateAuthorities.utility[request.utility]) {
      throw new InvalidInputError(
        `Invalid utility: "${request.utility}".`,
        'utility',
      );
    }
  }

  const isUnder80Ami = household_income < Number(ami[`l80_${household_size}`]);
  const isUnder150Ami =
    household_income < Number(ami[`l150_${household_size}`]);
  const isOver150Ami =
    household_income >= Number(ami[`l150_${household_size}`]);

  const incentives: CalculatedIncentive[] = [];
  let savings: APISavings = zeroSavings();
  let coverage: APICoverage = {
    state: null,
    utility: null,
  };

  if (!authority_types || authority_types.includes(AuthorityType.Federal)) {
    const federal = calculateFederalIncentivesAndSavings(
      ami,
      calculations,
      stateMFI,
      solarSystemCost,
      request,
    );
    incentives.push(...federal.federalIncentives);
    savings = addSavings(savings, federal.savings);
  }

  if (
    !authority_types ||
    authority_types.includes(AuthorityType.State) ||
    authority_types.includes(AuthorityType.Utility) ||
    authority_types.includes(AuthorityType.County) ||
    authority_types.includes(AuthorityType.City)
  ) {
    const allStateIncentives = getAllStateIncentives(state_id, request);
    const stateIncentiveRelationships =
      getStateIncentiveRelationships(state_id);
    const state = calculateStateIncentivesAndSavings(
      location,
      request,
      allStateIncentives,
      stateIncentiveRelationships,
      stateAuthorities,
    );
    incentives.push(...state.stateIncentives);
    savings = addSavings(savings, state.savings);
    coverage = state.coverage;
  }

  // Get tax owed to determine max potential tax savings
  const tax = estimateTaxAmount(tax_filing as FilingStatus, household_income);

  // You can't save more than tax owed. Choose the lesser of tax owed vs tax savings
  if (savings.tax_credit > tax.tax_owed) {
    savings.tax_credit = tax.tax_owed;
  }

  // Sort incentives https://app.asana.com/0/0/1204275945510481/f
  // Sort by payment method first, treating "performance_rebate" the same as
  // "pos_rebate" for backward compatibility.
  // Within each of those categories, put "percent" items first, then
  // "dollar_amount", then sort by amount with highest first.
  const adjustedType = (i: CalculatedIncentive) =>
    i.type === PaymentMethod.PerformanceRebate
      ? PaymentMethod.PosRebate
      : i.type;
  const sortedIncentives = _.orderBy(
    incentives,
    [adjustedType, i => i.amount.type, i => i.amount.number],
    ['asc', 'desc', 'desc'],
  );

  const authorities: AuthoritiesById = {};
  if (stateAuthorities) {
    incentives.forEach(i => {
      if (
        'authority' in i &&
        i.authority &&
        (i.authority_type === 'state' || i.authority_type === 'utility')
      ) {
        authorities[i.authority] =
          stateAuthorities[i.authority_type][i.authority];
      }
    });
  }

  return {
    is_under_80_ami: isUnder80Ami,
    is_under_150_ami: isUnder150Ami,
    is_over_150_ami: isOver150Ami,
    authorities,
    coverage,
    location: {
      state: state_id,
      city: location.city,
      county: location.county,
    },
    savings,
    incentives: sortedIncentives,
  };
}
