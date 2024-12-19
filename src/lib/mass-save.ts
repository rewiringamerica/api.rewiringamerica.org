import { GEO_GROUPS_BY_STATE } from '../data/geo_groups';
import { Program } from '../data/types/program';

export const EXCEPTION_ELECTRIC_UTILITIES: string[] = [
  'ma-braintree-electric-light-department',
  'ma-town-of-littleton',
  'ma-town-of-mansfield',
  // West Boylston is also an exception, but not in authorities.json yet
];

/**
 * Mass Save is a consortium of electric and gas utilities; their member
 * utilities serve the vast majority of people in MA. For a user in MA to be
 * eligible for an incentive, ANY of the following must be true:
 *
 * 1. It's not a utility incentive at all
 *
 * 2. It belongs to Mass Save, and the user is a customer of a Mass Save member
 *    utility (for EITHER electricity or gas)
 *
 * 3. It belongs to a non-Mass Save utility, and the user is NOT a customer of
 *    any Mass Save member utility
 *
 * 4. It belongs to a non-Mass Save utility that is one of the few exceptions to
 *    point 3.
 *
 * The gist is that any customer of a Mass Save utility can access Mass Save
 * incentives. Small non-Mass Save utilities only want to let their customers
 * access their incentives if they don't also have access to Mass Save.
 *
 * This check is partially redundant with the standard geo group check, which is
 * upstream of this one. The case where the request does not have a Mass Save
 * utility, and the incentive is a Mass Save one, will not reach here; the geo
 * group check will filter it out. However, this function still returns the
 * correct result for that case.
 */
export function isEligibleUnderMassSaveRule(
  program: Program,
  requestUtility: string | undefined,
  requestGasUtility: string | undefined,
): boolean {
  // This assumes that we don't have incentive records that are associated
  // directly with any of the Mass Save member utilities.
  const isMassSaveIncentive =
    program.authority_type === 'other' && program.authority === 'ma-massSave';

  // Point 1
  if (
    !isMassSaveIncentive &&
    program.authority_type !== 'utility' &&
    program.authority_type !== 'gas_utility'
  ) {
    return true;
  }

  const group = GEO_GROUPS_BY_STATE['MA']['ma-mass-save'];
  const isDefinitelyMassSaveCustomer =
    (requestUtility !== undefined &&
      group.utilities!.includes(requestUtility)) ||
    (requestGasUtility !== undefined &&
      group.gas_utilities!.includes(requestGasUtility));

  // Be conservative and assume that the user may be a Mass Save customer if
  // either their electric utility or gas utility is unknown.
  const mayBeMassSaveCustomer =
    isDefinitelyMassSaveCustomer ||
    requestUtility === undefined ||
    requestGasUtility === undefined;

  const isCustomerOfException =
    requestUtility !== undefined &&
    EXCEPTION_ELECTRIC_UTILITIES.includes(requestUtility);

  return (
    // Point 2
    (isMassSaveIncentive && isDefinitelyMassSaveCustomer) ||
    // Point 3
    (!isMassSaveIncentive && !mayBeMassSaveCustomer) ||
    // Point 4
    (!isMassSaveIncentive && isCustomerOfException)
  );
}
