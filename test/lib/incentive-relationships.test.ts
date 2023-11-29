import { test } from 'tap';
import { AuthorityType } from '../../src/data/authorities';
import { FilingStatus } from '../../src/data/tax_brackets';
import { OwnerStatus } from '../../src/data/types/owner-status';
import { calculateStateIncentivesAndSavings } from '../../src/lib/state-incentives-calculation';
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
  );
  t.ok(data);
  // Currently the test data only includes incentive A, so that is the only
  // incentive that should be included in the results.
  t.equal(data.stateIncentives[0].id, 'A');
  t.equal(data.stateIncentives[0].eligible, true);
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
  );
  t.ok(data);
  t.equal(data.stateIncentives.length, 0);
});

// If we provide test incentives but a state code that we haven't launched, no
// incentives should be returned.
test('test calculation with unlaunched state', async t => {
  const data = calculateStateIncentivesAndSavings(
    'AA',
    {
      owner_status: OwnerStatus.Homeowner,
      household_income: 120000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.State],
      include_beta_states: true,
    },
    TEST_INCENTIVES,
  );
  t.ok(data);
  t.equal(data.stateIncentives.length, 0);
});
