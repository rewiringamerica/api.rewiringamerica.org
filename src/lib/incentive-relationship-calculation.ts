import { IncentiveRelationships } from '../data/state_incentive_relationships';
import { StateIncentive } from '../data/state_incentives';

/* Uses relationships object to build two maps:
- one from incentive ID to a set of IDs of incentives it requires (requiresMap),
- one from incentive ID to a set of IDs of incentives that require it (requiredByMap)
*/
export function buildPrerequisiteMaps(
  incentiveRelationships: IncentiveRelationships,
) {
  const requiresMap = new Map<string, Set<string>>();
  const requiredByMap = new Map<string, Set<string>>();
  if (incentiveRelationships.prerequisites !== undefined) {
    for (const [incentiveId, prerequisiteIds] of Object.entries(
      incentiveRelationships.prerequisites,
    )) {
      requiresMap.set(incentiveId, new Set(prerequisiteIds));

      for (const prerequisiteId of prerequisiteIds) {
        const existingDependencies = requiredByMap.get(prerequisiteId);
        if (existingDependencies !== undefined) {
          existingDependencies.add(incentiveId);
        } else {
          requiredByMap.set(prerequisiteId, new Set(incentiveId));
        }
      }
    }
  }
  return { requiresMap, requiredByMap };
}

// Builds a graph of incentive relationships, represented as pairs of incentive
// ID and the set of IDs of incentives that are dependent on that incentive.
export function buildRelationshipGraph(data: IncentiveRelationships) {
  const edges = new Map<string, Set<string>>();
  // For exclusion relationships, the superseding incentive is the "source."
  if (data.exclusions !== undefined) {
    for (const [incentiveId, supersededIds] of Object.entries(
      data.exclusions,
    )) {
      edges.set(incentiveId, new Set(supersededIds));
    }
  }

  // For prerequisite relationships, the required incentive is the "source."
  if (data.prerequisites !== undefined) {
    for (const [incentiveId, requiredByIds] of buildPrerequisiteMaps(data)
      .requiredByMap) {
      const existingRelationships = edges.get(incentiveId);
      if (existingRelationships !== undefined) {
        for (const requiredById of requiredByIds) {
          existingRelationships.add(requiredById);
        }
      } else {
        edges.set(incentiveId, new Set(requiredByIds));
      }
    }
  }
  return edges;
}

/* Checks the prerequisites for a single incentive and updates its eligibility
     accordingly.
     If the user is not eligible for a prerequisite incentive, this incentive is
     removed from the eligible incentives, and then we check any incentives that
     require this one.
  */
export function checkPrerequisites(
  incentiveId: string,
  prerequisiteIds: Set<string>,
  eligibleIncentives: Map<string, StateIncentive>,
  ineligibleIncentives: Map<string, StateIncentive>,
  dependentsMap: Map<string, Set<string>>,
) {
  for (const prerequisiteId of prerequisiteIds) {
    if (
      eligibleIncentives.has(incentiveId) &&
      !eligibleIncentives.has(prerequisiteId)
    ) {
      makeIneligible(
        eligibleIncentives.get(incentiveId)!,
        eligibleIncentives,
        ineligibleIncentives,
        dependentsMap,
      );
    }
  }
}

// Switches an incentive from eligible to ineligible and checks dependencies.
function makeIneligible(
  incentive: StateIncentive,
  eligibleIncentives: Map<string, StateIncentive>,
  ineligibleIncentives: Map<string, StateIncentive>,
  dependentsMap: Map<string, Set<string>>,
) {
  eligibleIncentives.delete(incentive.id);
  ineligibleIncentives.set(incentive.id, incentive);
  const dependentIds = dependentsMap.get(incentive.id);
  if (dependentIds !== undefined) {
    for (const dependentId of dependentIds) {
      const dependent = eligibleIncentives.get(dependentId);
      if (dependent !== undefined) {
        makeIneligible(
          dependent,
          eligibleIncentives,
          ineligibleIncentives,
          dependentsMap,
        );
      }
    }
  }
  // TODO: also need to check supersedes map when mutual exclusion relationships are implemented.
}
