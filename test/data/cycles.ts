// Helper to check for circular dependencies in the incentive relationships.
export function checkForCycle(
  incentiveId: string,
  seen: Set<string>,
  finished: Set<string>,
  edges: Map<string, Set<string>>,
) {
  if (finished.has(incentiveId)) {
    // We've already finished checking this incentive.
    return false;
  }
  if (seen.has(incentiveId)) {
    // We haven't finished checking this incentive's dependencies but are
    // visiting it for the second time. This is a cycle.
    return true;
  }
  seen.add(incentiveId);
  const dependencies = edges.get(incentiveId);
  if (dependencies !== undefined) {
    for (const id of dependencies) {
      if (checkForCycle(id, seen, finished, edges)) {
        return true;
      }
    }
  }
  finished.add(incentiveId);
  return false;
}

export function incentiveRelationshipsContainCycle(
  relationshipGraph: Map<string, Set<string>>,
) {
  const seen = new Set<string>();
  const finished = new Set<string>();
  const toCheck = Array.from(relationshipGraph.keys());
  let hasCycle = false;
  if (toCheck !== undefined) {
    for (const incentiveId of toCheck) {
      hasCycle = checkForCycle(incentiveId, seen, finished, relationshipGraph);
      if (hasCycle) {
        break;
      }
    }
  }
  return hasCycle;
}
