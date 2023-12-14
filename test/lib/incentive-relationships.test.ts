import { test } from 'tap';
import { AuthorityType } from '../../src/data/authorities';
import { FilingStatus } from '../../src/data/tax_brackets';
import { OwnerStatus } from '../../src/data/types/owner-status';
import { buildRelationshipGraph } from '../../src/lib/incentive-relationship-calculation';
import { calculateStateIncentivesAndSavings } from '../../src/lib/state-incentives-calculation';
import { incentiveRelationshipsContainCycle } from '../data/schemas.test';
import {
  TEST_INCENTIVE_RELATIONSHIPS,
  TEST_INVALID_INCENTIVE_RELATIONSHIPS,
} from '../mocks/state-incentive-relationships';
import { TEST_INCENTIVES } from '../mocks/state-incentives';

// This is a basic test to set up supplying test data to the calculator logic.
// When the incentive relationship logic is implemented, we'll use this to
// create some more complex test cases to make sure that works as intended.
test('basic test for supplying test incentive data to calculation logic', async t => {
  const data = calculateStateIncentivesAndSavings(
    'RI',
    {
      owner_status: OwnerStatus.Homeowner,
      household_income: 120000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: false,
    },
    TEST_INCENTIVES,
    TEST_INCENTIVE_RELATIONSHIPS,
  );
  t.ok(data);
  // There are 4 test incentives and this user is eligible for all of them.
  t.equal(data.stateIncentives.length, 4);
  for (const incentive of data.stateIncentives) {
    t.equal(incentive.eligible, true);
  }
});

test('test calculation with no incentives', async t => {
  const data = calculateStateIncentivesAndSavings(
    'RI',
    {
      owner_status: OwnerStatus.Homeowner,
      household_income: 120000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: true,
    },
    [],
    TEST_INCENTIVE_RELATIONSHIPS,
  );
  t.ok(data);
  t.equal(data.stateIncentives.length, 0);
});

// This user is a renter, so they only are eligible for incentives A, B, and C.
// However, since D is a prerequisite for C, after checking incentive
// relationships, they are not eligible for C either.
test('test incentive prerequisite logic', async t => {
  const data = calculateStateIncentivesAndSavings(
    'RI',
    {
      owner_status: OwnerStatus.Renter,
      household_income: 120000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: true,
    },
    TEST_INCENTIVES,
    TEST_INCENTIVE_RELATIONSHIPS,
  );
  t.ok(data);
  t.equal(data.stateIncentives.length, 4);
  // Check that the user is only eligible for A and B.
  for (const incentive of data.stateIncentives) {
    if (incentive.id === 'A' || incentive.id === 'B') {
      t.equal(incentive.eligible, true);
    }
    if (incentive.id === 'C' || incentive.id === 'D') {
      t.equal(incentive.eligible, false);
    }
  }
});

test('test incentive relationships contain no circular dependencies', async tap => {
  // Check that there are no circular dependencies in the relationships.
  const relationshipGraph = buildRelationshipGraph(
    TEST_INCENTIVE_RELATIONSHIPS,
  );
  tap.equal(incentiveRelationshipsContainCycle(relationshipGraph), false);
});

test('test cycle detection in invalid incentive relationships', async tap => {
  // Check that the circular dependency in the invalid relationships is
  // detected.
  const relationshipGraph = buildRelationshipGraph(
    TEST_INVALID_INCENTIVE_RELATIONSHIPS,
  );
  tap.equal(incentiveRelationshipsContainCycle(relationshipGraph), true);
});
