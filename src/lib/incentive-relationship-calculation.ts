import { IncentiveRelationships } from '../data/state_incentive_relationships';
import { StateIncentive } from '../data/state_incentives';

export interface RelationshipMaps {
  eligibleIncentives: Map<string, StateIncentive>;
  ineligibleIncentives: Map<string, StateIncentive>;
  requiresMap: Map<string, Set<string>>;
  requiredByMap: Map<string, Set<string>>;
  supersedesMap: Map<string, Set<string>>;
  supersededByMap: Map<string, Set<string>>;
}

// Represents a set of incentives that have a combined max savings amount and
// the amount of eligible savings remaining for the given user.
export interface CombinedValue {
  remainingValue: number;
}

// Uses relationships object to build two maps:
// - one from incentive ID to a set of IDs of incentives it requires (requiresMap),
// - one from incentive ID to a set of IDs of incentives that require it (requiredByMap)
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
export function hasPrerequisites(incentiveId: string, maps: RelationshipMaps) {
  const prerequisiteIds = maps.requiresMap.get(incentiveId);
  if (prerequisiteIds !== undefined) {
    for (const prerequisiteId of prerequisiteIds) {
      if (
        !maps.eligibleIncentives.has(prerequisiteId) &&
        maps.eligibleIncentives.has(incentiveId)
      ) {
        return false;
      }
    }
  }
  return true;
}

// Checks the mutual exclusion relationships for a single incentive.
export function isExcluded(incentiveId: string, maps: RelationshipMaps) {
  const supersedingIds = maps.supersededByMap.get(incentiveId);
  if (supersedingIds !== undefined) {
    for (const supersedingId of supersedingIds) {
      if (
        maps.eligibleIncentives.has(supersedingId) &&
        maps.eligibleIncentives.has(incentiveId)
      ) {
        return true;
      }
    }
  }
  return false;
}

// Switches an incentive from eligible to ineligible and checks dependents.
export function makeIneligible(incentiveId: string, maps: RelationshipMaps) {
  const incentive = maps.eligibleIncentives.get(incentiveId);
  if (incentive === undefined) {
    return;
  }
  maps.eligibleIncentives.delete(incentiveId);
  maps.ineligibleIncentives.set(incentiveId, incentive);

  // When an incentive becomes ineligible, things that require it also become ineligible.
  if (maps.requiredByMap.has(incentiveId)) {
    for (const dependentId of maps.requiredByMap.get(incentiveId)!) {
      makeIneligible(dependentId, maps);
    }
  }

  // When an incentive becomes ineligible, things that it supersedes might become eligible.
  if (maps.supersedesMap.has(incentiveId)) {
    for (const dependentId of maps.supersedesMap.get(incentiveId)!) {
      if (
        maps.ineligibleIncentives.has(dependentId) &&
        !isExcluded(dependentId, maps) &&
        hasPrerequisites(dependentId, maps)
      ) {
        makeEligible(dependentId, maps);
      }
    }
  }
}

// Switches an incentive from ineligible to eligible and checks dependents.
export function makeEligible(incentiveId: string, maps: RelationshipMaps) {
  const incentive = maps.ineligibleIncentives.get(incentiveId);
  if (incentive === undefined) {
    return;
  }
  maps.ineligibleIncentives.delete(incentiveId);
  maps.eligibleIncentives.set(incentiveId, incentive);

  // When an incentive becomes eligible, things that require it might become eligible.
  if (maps.requiredByMap.has(incentiveId)) {
    for (const dependentId of maps.requiredByMap.get(incentiveId)!) {
      if (
        maps.ineligibleIncentives.has(dependentId) &&
        !isExcluded(dependentId, maps) &&
        hasPrerequisites(dependentId, maps)
      ) {
        makeEligible(dependentId, maps);
      }
    }
  }

  // When an incentive becomes eligible, things that it supersedes become ineligible.
  if (maps.supersedesMap.has(incentiveId)) {
    for (const dependentId of maps.supersedesMap.get(incentiveId)!) {
      makeIneligible(dependentId, maps);
    }
  }
}

// Evaluates the incentive combinations and returns a map from incentive ID to
// a set of CombinedValue objects, which store the remaining value for a group
// of incentives.
export function getCombinedMaximums(relationships: IncentiveRelationships) {
  const groupedIncentives = new Map<string, Set<CombinedValue>>();

  if (relationships.combinations !== undefined) {
    for (const combination of relationships.combinations) {
      const combinedValue: CombinedValue = {
        remainingValue: combination.max_value,
      };
      for (const incentiveId of combination.ids) {
        const combinedValuesForIncentive = groupedIncentives.get(incentiveId);
        if (combinedValuesForIncentive !== undefined) {
          combinedValuesForIncentive.add(combinedValue);
        } else {
          groupedIncentives.set(incentiveId, new Set([combinedValue]));
        }
      }
    }
  }
  return groupedIncentives;
}
