import _ from 'lodash';
import {
  AUTHORITIES_BY_STATE,
  AuthoritiesById,
  AuthorityType,
  NO_GAS_UTILITY,
} from '../data/authorities';
import { DataPartnersType } from '../data/data_partners';
import { IRA_INCENTIVES } from '../data/ira_incentives';
import { PROGRAMS } from '../data/programs';
import { StateIncentive } from '../data/state_incentives';
import { FilingStatus } from '../data/tax_brackets';
import { APICoverage } from '../data/types/coverage';
import { PaymentMethod } from '../data/types/incentive-types';
import { OwnerStatus } from '../data/types/owner-status';
import {
  APICalculatorRequest,
  APICalculatorResponse,
} from '../schemas/v1/calculator-endpoint';
import { AMIAndEVCreditEligibility } from './ami-evcredit-calculation';
import { InvalidInputError, UnexpectedInputError } from './error';
import { ResolvedLocation } from './location';
import {
  calculateStateIncentives,
  getAllStateIncentives,
  getStateDataPartners,
  getStateIncentiveRelationships,
} from './state-incentives-calculation';

const OWNER_STATUSES = new Set(Object.values(OwnerStatus));
const TAX_FILINGS = new Set(Object.values(FilingStatus));

IRA_INCENTIVES.forEach(incentive => Object.freeze(incentive));

/**
 * calculateIncentives() returns something that is almost the API response
 * object, but with incentives in a format closer to the static JSON format.
 * Replace the type of the "incentives" property.
 */
type CalculatedIncentives = Omit<APICalculatorResponse, 'incentives'> & {
  incentives: StateIncentive[];
};

export type CalculateParams = Omit<APICalculatorRequest, 'location'>;

export default function calculateIncentives(
  location: ResolvedLocation,
  amiAndEvCreditEligibility: AMIAndEVCreditEligibility,
  request: CalculateParams,
): CalculatedIncentives {
  const {
    owner_status,
    household_income,
    tax_filing,
    household_size,
    authority_types,
  } = request;

  const state_id = location.state;

  if (!OWNER_STATUSES.has(owner_status)) {
    throw new UnexpectedInputError('Unknown owner_status');
  }

  if (tax_filing && !TAX_FILINGS.has(tax_filing)) {
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

  if (
    authority_types &&
    authority_types.includes(AuthorityType.GasUtility) &&
    (!request.gas_utility || request.gas_utility === NO_GAS_UTILITY)
  ) {
    throw new InvalidInputError(
      `Must include the "gas_utility" field, with a value other than \
"${NO_GAS_UTILITY}", when requesting gas utility incentives.`,
      'gas_utility',
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

  if (request.gas_utility && request.gas_utility !== NO_GAS_UTILITY) {
    if (!stateAuthorities.gas_utility) {
      throw new InvalidInputError(
        `We do not yet have information about gas utilities in ${state_id}.`,
        'gas_utility',
      );
    }
    if (!stateAuthorities.gas_utility[request.gas_utility]) {
      throw new InvalidInputError(
        `Invalid gas utility: "${request.gas_utility}.`,
        'gas_utility',
      );
    }
  }

  const isUnder80Ami =
    household_income < amiAndEvCreditEligibility.computedAMI80;
  const isUnder150Ami =
    household_income < amiAndEvCreditEligibility.computedAMI150;
  const isOver150Ami = !isUnder150Ami;

  const allStateIncentives = getAllStateIncentives(state_id, request);
  const stateIncentiveRelationships = getStateIncentiveRelationships(state_id);
  const incentives = calculateStateIncentives(
    location,
    request,
    [...IRA_INCENTIVES, ...allStateIncentives],
    stateIncentiveRelationships,
    stateAuthorities,
    PROGRAMS,
    amiAndEvCreditEligibility,
  );

  const coverage: APICoverage =
    allStateIncentives.length > 0
      ? { state: state_id, utility: request.utility || null }
      : { state: null, utility: null };

  // Sort incentives https://app.asana.com/0/0/1204275945510481/f
  // Sort by payment method first, treating "performance_rebate" the same as
  // "pos_rebate" for backward compatibility.
  // Within each of those categories, put "percent" items first, then
  // "dollar_amount", then sort by amount with highest first.
  const adjustedType = (i: StateIncentive) =>
    i.payment_methods[0] === PaymentMethod.PerformanceRebate
      ? PaymentMethod.PosRebate
      : i.payment_methods[0];
  const sortedIncentives = _.orderBy(
    incentives,
    [adjustedType, i => i.amount.type, i => i.amount.number],
    ['asc', 'desc', 'desc'],
  );

  const authorities: AuthoritiesById = {};
  if (stateAuthorities) {
    incentives.forEach(i => {
      const program = PROGRAMS[i.program];
      if (
        program.authority !== null &&
        program.authority_type !== AuthorityType.Federal
      ) {
        authorities[program.authority] =
          stateAuthorities[program.authority_type]![program.authority];
      }
    });
  }

  const data_partners: DataPartnersType = getStateDataPartners(
    state_id,
    request,
  );

  return {
    is_under_80_ami: isUnder80Ami,
    is_under_150_ami: isUnder150Ami,
    is_over_150_ami: isOver150Ami,
    authorities,
    coverage,
    data_partners,
    location,
    incentives: sortedIncentives,
  };
}
