import fs from 'fs';
import { IncentiveRelationships } from '../../src/data/state_incentive_relationships';

// These are model incentive relationships created for the purpose of testing
// specific aspects of calculator logic. They are not intended to be included
// with any launched data.
export const TEST_INCENTIVE_RELATIONSHIPS: IncentiveRelationships = JSON.parse(
  fs.readFileSync('./test/fixtures/test-incentive-relationships.json', 'utf-8'),
);
