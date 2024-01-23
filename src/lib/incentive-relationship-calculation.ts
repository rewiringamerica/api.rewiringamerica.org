import {
  IncentivePrerequisites,
  IncentiveRelationships,
} from '../data/state_incentive_relationships';
import { StateIncentive } from '../data/state_incentives';

export interface RelationshipMaps {
  eligibleIncentives: Map<string, StateIncentive>;
  ineligibleIncentives: Map<string, StateIncentive>;
  requiresMap: Map<string, Set<string>>;
  requiredByMap: Map<string, Set<string>>;
  structuredPrerequisitesMap: Map<string, IncentivePrerequisites>;
  supersedesMap: Map<string, Set<string>>;
  supersededByMap: Map<string, Set<string>>;
}

// Represents a set of incentives that have a combined max savings amount and
// the amount of eligible savings remaining for the given user.
export interface CombinedValue {
  remainingValue: number;
}

// Helper to traverse nested prerequisites and add them to the set of prereqs
// for a single incentive.
export function addPrerequisites(
  prerequisites: IncentivePrerequisites,
  prerequisitesSet: Set<string>,
) {
  if (typeof prerequisites === 'string') {
    prerequisitesSet.add(prerequisites as string);
  } else if ('anyOf' in prerequisites) {
    for (const prerequisite of prerequisites.anyOf) {
      addPrerequisites(prerequisite, prerequisitesSet);
    }
  } else if ('allOf' in prerequisites) {
    for (const prerequisite of prerequisites.allOf) {
      addPrerequisites(prerequisite, prerequisitesSet);
    }
  }
}

// Uses relationships object to build three maps:
// - one from incentive ID to a set of IDs of incentives it requires (requiresMap),
// - one from incentive ID to a set of IDs of incentives that require it (requiredByMap),
// - one from incentive ID to the format that preserves any nesting of prerequisites.
export function buildPrerequisiteMaps(
  incentiveRelationships: IncentiveRelationships,
) {
  const requiresMap = new Map<string, Set<string>>();
  const requiredByMap = new Map<string, Set<string>>();
  const structuredPrerequisitesMap = new Map<string, IncentivePrerequisites>();
  if (incentiveRelationships.prerequisites !== undefined) {
    for (const [incentiveId, prerequisites] of Object.entries(
      incentiveRelationships.prerequisites,
    )) {
      structuredPrerequisitesMap.set(incentiveId, prerequisites);

      const prerequisiteIds = new Set<string>();
      addPrerequisites(prerequisites, prerequisiteIds);
      requiresMap.set(incentiveId, new Set(prerequisiteIds));

      for (const prerequisiteId of prerequisiteIds) {
        const existingDependencies = requiredByMap.get(prerequisiteId);
        if (existingDependencies !== undefined) {
          existingDependencies.add(incentiveId);
        } else {
          requiredByMap.set(prerequisiteId, new Set([incentiveId]));
        }
      }
    }
  }
  return { requiresMap, requiredByMap, structuredPrerequisitesMap };
}

// Uses relationships object to build two maps:
// - one from incentive ID to a set of IDs of incentives that it supersedes (supersedesMap),
// - one from incentive ID to a set of IDs of incentives that supersede it (supersededByMap)
export function buildExclusionMaps(
  incentiveRelationships: IncentiveRelationships,
) {
  const supersedesMap = new Map<string, Set<string>>();
  const supersededByMap = new Map<string, Set<string>>();
  if (incentiveRelationships.exclusions !== undefined) {
    for (const [incentiveId, supersededIds] of Object.entries(
      incentiveRelationships.exclusions,
    )) {
      supersedesMap.set(incentiveId, new Set(supersededIds));

      for (const supersededId of supersededIds) {
        const existingDependencies = supersededByMap.get(supersededId);
        if (existingDependencies !== undefined) {
          existingDependencies.add(incentiveId);
        } else {
          supersededByMap.set(supersededId, new Set([incentiveId]));
        }
      }
    }
  }
  return { supersedesMap, supersededByMap };
}

// Builds a graph of incentive relationships, represented as pairs of incentive
// ID and the set of IDs of incentives that are dependent on that incentive.
// This is only used for cycle detection when we validate the relationships.
export function buildRelationshipGraph(data: IncentiveRelationships) {
  const edges = buildExclusionMaps(data).supersedesMap;

  // For prerequisite relationships, the required incentive is the "source."
  if (data.prerequisites !== undefined) {
    for (const [incentiveId, dependentIds] of buildPrerequisiteMaps(data)
      .requiredByMap) {
      const existingRelationships = edges.get(incentiveId);
      if (existingRelationships !== undefined) {
        for (const dependentId of dependentIds) {
          existingRelationships.add(dependentId);
        }
      } else {
        edges.set(incentiveId, new Set(dependentIds));
      }
    }
  }
  return edges;
}

// Helper to traverse nested prerequisites and check whether they are met for
// the given incentive.
function MeetsNestedPrerequisites(
  incentiveId: string,
  prerequisite: IncentivePrerequisites,
  maps: RelationshipMaps,
) {
  if (typeof prerequisite === 'string') {
    return maps.eligibleIncentives.has(prerequisite);
  } else if ('anyOf' in prerequisite) {
    for (const child of prerequisite.anyOf) {
      if (MeetsNestedPrerequisites(incentiveId, child, maps)) {
        return true;
      }
    }
    return false;
  } else if ('allOf' in prerequisite) {
    for (const child of prerequisite.allOf) {
      if (!MeetsNestedPrerequisites(incentiveId, child, maps)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

// Checks the prerequisites for a single incentive.
export function meetsPrerequisites(
  incentiveId: string,
  maps: RelationshipMaps,
) {
  const structuredPrerequisites =
    maps.structuredPrerequisitesMap.get(incentiveId);
  if (structuredPrerequisites !== undefined) {
    return MeetsNestedPrerequisites(incentiveId, structuredPrerequisites, maps);
  }
  return true;
}

// Checks the mutual exclusion relationships for a single incentive.
export function isExcluded(incentiveId: string, maps: RelationshipMaps) {
  const supersedingIds = maps.supersededByMap.get(incentiveId);
  if (supersedingIds !== undefined) {
    for (const supersedingId of supersedingIds) {
      if (maps.eligibleIncentives.has(supersedingId)) {
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

  // When an incentive becomes ineligible, things that require it also may become ineligible.
  if (maps.requiredByMap.has(incentiveId)) {
    for (const dependentId of maps.requiredByMap.get(incentiveId)!) {
      if (
        maps.eligibleIncentives.has(dependentId) &&
        !meetsPrerequisites(dependentId, maps)
      ) {
        makeIneligible(dependentId, maps);
      }
    }
  }

  // When an incentive becomes ineligible, things that it supersedes might become eligible.
  if (maps.supersedesMap.has(incentiveId)) {
    for (const dependentId of maps.supersedesMap.get(incentiveId)!) {
      if (
        maps.ineligibleIncentives.has(dependentId) &&
        !isExcluded(dependentId, maps) &&
        meetsPrerequisites(dependentId, maps)
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
        meetsPrerequisites(dependentId, maps)
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
// a CombinedValue object, which stores the remaining value for a group of incentives.
export function getCombinedMaximums(relationships: IncentiveRelationships) {
  const groupedIncentives = new Map<string, CombinedValue>();

  if (relationships.combinations !== undefined) {
    for (const combination of relationships.combinations) {
      const combinedValue: CombinedValue = {
        remainingValue: combination.max_value,
      };
      for (const incentiveId of combination.ids) {
        groupedIncentives.set(incentiveId, combinedValue);
      }
    }
  }
  return groupedIncentives;
}
