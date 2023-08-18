import _ from 'lodash';
import { AUTHORITIES_BY_STATE, AuthorityType } from '../data/authorities';
import { IRA_INCENTIVES, OwnerStatus } from '../data/ira_incentives';
import { SOLAR_PRICES } from '../data/solar_prices';
import { STATE_MFIS, StateMFI } from '../data/state_mfi';
import { FilingStatus } from '../data/tax_brackets';
import {
  APICalculatorRequest,
  APICalculatorResponse,
} from '../schemas/v1/calculator-endpoint';
import { APIIncentiveMinusItemUrl } from '../schemas/v1/incentive';
import { InvalidInputError, UnexpectedInputError } from './error';
import { AMI, CompleteIncomeInfo, MFI } from './income-info';
import { calculateStateIncentivesAndSavings } from './state-incentives-calculation';
import estimateTaxAmount from './tax-brackets';

const MAX_POS_SAVINGS = 14000;
const OWNER_STATUSES = new Set(['homeowner', 'renter']);
const TAX_FILINGS = new Set(['single', 'joint', 'hoh']);

IRA_INCENTIVES.forEach(incentive => Object.freeze(incentive));

function roundCents(dollars: number): number {
  return Math.round(dollars * 100) / 100;
}

/**
 * calculateIncentives() returns something that is almost the API response
 * object, but with incentives in a format closer to the static JSON format.
 * Replace the types of the two properties containing them.
 */
type CalculatedIncentives = Omit<
  APICalculatorResponse,
  'pos_rebate_incentives' | 'tax_credit_incentives'
> & {
  pos_rebate_incentives: APIIncentiveMinusItemUrl[];
  tax_credit_incentives: APIIncentiveMinusItemUrl[];
};

export type CalculateParams = Omit<APICalculatorRequest, 'location'>;

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
  federalIncentives: APIIncentiveMinusItemUrl[];
  pos_savings: number;
  performance_rebate_savings: number;
  tax_savings: number;
} {
  const eligibleIncentives: APIIncentiveMinusItemUrl[] = [];
  const ineligibleIncentives: APIIncentiveMinusItemUrl[] = [];

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
    // @TODO: use example prices and percent amounts, not pre-computed 30% values here
    //
    const amount = { ...item.amount };
    if (item.item_type === 'solar_tax_credit') {
      amount.representative = roundCents(solarSystemCost * amount.number!);
    }

    if (item.item_type === 'ev_charger_credit') {
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
      authority_type: AuthorityType.Federal,
      authority_name: null,
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
      const key = { item: item.item, item_type: item.item_type };
      return _.find(eligibleIncentives, key) === undefined;
    }),
    item => item.item + item.item_type,
  );

  const calculatedIncentives = [
    ...eligibleIncentives,
    ...dedupedIneligibleIncentives,
  ];

  //
  // Loop through every eligible incentive and add any with an "immediate" dollar value
  //
  let performance_rebate_savings = 0;
  let pos_savings = 0;
  let tax_savings = 0;
  for (const item of eligibleIncentives) {
    if (item.type === 'pos_rebate') {
      // count performance rebates separately
      if (item.item_type === 'performance_rebate') {
        performance_rebate_savings += item.amount.number!;
      } else {
        pos_savings += item.amount.number!;
      }
    } else if (item.type === 'tax_credit') {
      // if this is a dollar amount, just add it up:
      if (item.amount.type === 'dollar_amount') {
        tax_savings += item.amount.number!;
      } else if (item.amount.representative) {
        // otherwise, it's a percentage. If there's a representative amount, use that:
        tax_savings += item.amount.representative;
      }
    } else {
      throw new UnexpectedInputError(`Unknown item_type: ${item.type}`);
    }
  }

  // The max POS savings is $14,000 if you're under 150% ami, otherwise 0
  pos_savings =
    household_income < Number(ami[`l150_${household_size}`]) &&
    owner_status !== 'renter'
      ? MAX_POS_SAVINGS
      : pos_savings;

  return {
    federalIncentives: calculatedIncentives,
    performance_rebate_savings,
    tax_savings,
    pos_savings,
  };
}

export default function calculateIncentives(
  { location: { state_id }, ami, calculations }: CompleteIncomeInfo,
  request: CalculateParams,
): CalculatedIncentives {
  const authorityTypes = request.authority_types ?? [AuthorityType.Federal];
  const { owner_status, household_income, tax_filing, household_size } =
    request;

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

  const stateAuthorities = AUTHORITIES_BY_STATE[state_id];
  if (
    !stateAuthorities &&
    (authorityTypes.includes(AuthorityType.State) ||
      authorityTypes.includes(AuthorityType.Utility))
  ) {
    throw new InvalidInputError(
      `We do not yet have state-level coverage in ${state_id}.`,
    );
  }

  if (authorityTypes.includes(AuthorityType.Utility)) {
    if (!request.utility) {
      throw new InvalidInputError(
        'Must include the "utility" field when requesting utility incentives.',
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

  const incentives: APIIncentiveMinusItemUrl[] = [];
  let tax_savings = 0;
  let pos_savings = 0;
  let performance_rebate_savings = 0;

  if (authorityTypes.includes(AuthorityType.Federal)) {
    const federal = calculateFederalIncentivesAndSavings(
      ami,
      calculations,
      stateMFI,
      solarSystemCost,
      request,
    );
    incentives.push(...federal.federalIncentives);
    tax_savings += federal.tax_savings;
    pos_savings += federal.pos_savings;
    performance_rebate_savings += federal.performance_rebate_savings;
  }

  if (
    authorityTypes.includes(AuthorityType.State) ||
    authorityTypes.includes(AuthorityType.Utility)
  ) {
    const state = calculateStateIncentivesAndSavings(state_id, request);
    incentives.push(...state.stateIncentives);
    tax_savings += state.tax_savings;
    pos_savings += state.pos_savings;
    performance_rebate_savings += state.performance_rebate_savings;
  }

  // Get tax owed to determine max potiental tax savings
  const tax = estimateTaxAmount(tax_filing as FilingStatus, household_income);

  // Sort incentives https://app.asana.com/0/0/1204275945510481/f
  // put "percent" items first, then "dollar_amount", then sort by amount with highest first
  const sortedIncentives = _.orderBy(
    incentives,
    [i => i.amount.type, i => i.amount.number],
    ['desc', 'desc'],
  );

  return {
    is_under_80_ami: isUnder80Ami,
    is_under_150_ami: isUnder150Ami,
    is_over_150_ami: isOver150Ami,

    pos_savings,

    // You can't save more than tax owed. Choose the lesser of tax owed vs tax savings
    tax_savings: tax.tax_owed < tax_savings ? tax.tax_owed : tax_savings,

    // Not prominently displayed
    performance_rebate_savings,

    pos_rebate_incentives: sortedIncentives.filter(
      item => item.type === 'pos_rebate',
    ),
    tax_credit_incentives: sortedIncentives.filter(
      item => item.type === 'tax_credit',
    ),
  };
}
