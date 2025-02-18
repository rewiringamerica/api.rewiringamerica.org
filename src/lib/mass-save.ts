import { GEO_GROUPS_BY_STATE } from '../data/geo_groups';
import { Programs } from '../data/programs';
import { StateIncentive } from '../data/state_incentives';
import { Item } from '../data/types/items';

// Authorities that let you claim their incentives along with Mass Save's.
// These may be of any authority_type.
export const EXCEPTION_MLPS: string[] = [
  'ma-braintree-electric-light-department',
  'ma-town-of-littleton',
  'ma-town-of-mansfield',
  'ma-west-boylston-mlp',
];

export const MASS_SAVE_AUTHORITY = 'ma-massSave';
export const MASS_SAVE_UTILITIES =
  GEO_GROUPS_BY_STATE['MA']['ma-mass-save'].utilities!;
export const MASS_SAVE_GAS_UTILITIES =
  GEO_GROUPS_BY_STATE['MA']['ma-mass-save'].gas_utilities!;

/**
 * Mass Save is a consortium of electric and gas utilities; their member
 * utilities serve the vast majority of people in MA. They offer some incentives
 * as a consortium.
 *
 * In towns that have municipally-owned utilities (MLPs), some people are
 * customers of both a Mass Save utility and the MLP (one for electric and the
 * other for gas). In such cases, most of the MLPs don't want to offer an
 * incentive to someone who could get an incentive for the same thing from Mass
 * Save instead.
 *
 * This function implements that rule: an MLP incentive gets moved from the
 * eligible set to the ineligible set if all of its `items` are covered by the
 * totality of Mass Save incentives in the eligible set.
 *
 * There are some MLPs that don't impose this rule; you can claim both their
 * incentive and Mass Save's incentive for the same thing, if you're a customer
 * of both. Those are the `EXCEPTION_UTILITIES` above.
 *
 * In theory, we don't need bespoke logic for this rule at all; we could set up
 * exclusion ("supersedes" in HERO) relationships that would be equivalent. We
 * may do so eventually, but this is easier for now.
 */
export function applyMassSaveRule(
  eligibleIncentives: Map<string, StateIncentive>,
  ineligibleIncentives: Map<string, StateIncentive>,
  allPrograms: Programs,
) {
  // "MLP" is "municipal light plant": Massachusetts' term for municipal
  // electric utilities
  const isFromNonExceptionalMLP = (incentive: StateIncentive) => {
    const program = allPrograms[incentive.program];
    return (
      !!program.authority &&
      // It's not one of the authorities that lets you double-dip...
      !EXCEPTION_MLPS.includes(program.authority) &&
      // ...and either it's from an electric utility that's not in Mass Save...
      ((program.authority_type === 'utility' &&
        !MASS_SAVE_UTILITIES.includes(program.authority)) ||
        // ...or it's from a gas utility that's not in Mass Save (we don't
        // expect to have any programs like this, because there are no non-Mass
        // Save utilities that are gas only, but just in case)...
        (program.authority_type === 'gas_utility' &&
          !MASS_SAVE_GAS_UTILITIES.includes(program.authority)) ||
        // ...or it's from an "other" authority that isn't Mass Save itself.
        // (There are a couple of MLPs represented like this because they're
        // both electric and gas, and you can get their incentives if you're a
        // customer of either side.)
        (program.authority_type === 'other' &&
          program.authority !== MASS_SAVE_AUTHORITY))
    );
  };

  const isMassSaveIncentive = (incentive: StateIncentive) => {
    const program = allPrograms[incentive.program];
    return (
      program.authority_type === 'other' &&
      program.authority === MASS_SAVE_AUTHORITY
    );
  };

  // Collect all the items that Mass Save covers
  const massSaveItems = new Set<Item>();
  for (const incentive of eligibleIncentives.values()) {
    if (isMassSaveIncentive(incentive)) {
      incentive.items.forEach(item => massSaveItems.add(item));
    }
  }

  // This rule can only cause incentives to move from eligible to ineligible.
  // Keep the set of IDs to move over, then actually move them later, so we're
  // not modifying a Map while iterating over it.
  const incentivesToRemove = new Set<string>();

  for (const [id, incentive] of eligibleIncentives.entries()) {
    if (
      isFromNonExceptionalMLP(incentive) &&
      incentive.items.every(item => massSaveItems.has(item))
    ) {
      incentivesToRemove.add(id);
    }
  }

  // Move ineligible incentives over.
  for (const id of incentivesToRemove) {
    const incentive = eligibleIncentives.get(id)!;
    eligibleIncentives.delete(id);
    ineligibleIncentives.set(id, incentive);
  }
}
