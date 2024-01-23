import fs from 'fs';
import { IncentiveRelationships } from '../../src/data/state_incentive_relationships';

// These are model incentive relationships created for the purpose of testing
// specific aspects of calculator logic. They are not intended to be included
// with any launched data.
export const TEST_INCENTIVE_RELATIONSHIPS: IncentiveRelationships = JSON.parse(
  fs.readFileSync('./test/fixtures/test-incentive-relationships.json', 'utf-8'),
);

// Another set of model incentive relationships, for a somewhat more complex
// test.
export const TEST_INCENTIVE_RELATIONSHIPS_2: IncentiveRelationships =
  JSON.parse(
    fs.readFileSync(
      './test/fixtures/test-incentive-relationships-2.json',
      'utf-8',
    ),
  );

// Another set of model incentive relationships, for a somewhat more complex
// test.
export const TEST_INCENTIVE_RELATIONSHIPS_3: IncentiveRelationships =
  JSON.parse(
    fs.readFileSync(
      './test/fixtures/test-incentive-relationships-3.json',
      'utf-8',
    ),
  );

// Model incentive relationships intended for testing nested relationships.
export const TEST_NESTED_INCENTIVE_RELATIONSHIPS: IncentiveRelationships =
  JSON.parse(
    fs.readFileSync(
      './test/fixtures/test-incentive-relationships-nested.json',
      'utf-8',
    ),
  );

// These are model incentive relationships created for the purpose of checking
// that the schema tests can detect a circular dependency in incentive
// relationships.
export const TEST_INVALID_INCENTIVE_RELATIONSHIPS: IncentiveRelationships =
  JSON.parse(
    fs.readFileSync(
      './test/fixtures/test-invalid-incentive-relationships.json',
      'utf-8',
    ),
  );
