import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { afterEach, beforeEach, test } from 'tap';
import { AuthorityType } from '../../src/data/authorities';
import { FilingStatus } from '../../src/data/tax_brackets';
import { OwnerStatus } from '../../src/data/types/owner-status';
import { calculateStateIncentivesAndSavings } from '../../src/lib/state-incentives-calculation';
import { TEST_INCENTIVES } from '../mocks/state-incentives';

beforeEach(async t => {
  t.context.db = await open({
    filename: './incentives-api.db',
    driver: sqlite3.Database,
  });
});

afterEach(async t => {
  await t.context.db.close();
});

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
  // Currently the test data only includes RI-1, so that is the only incentive
  // that should be included in the results.
  t.equal(data.stateIncentives[0].id, 'RI-1');
  t.equal(data.stateIncentives[0].eligible, true);
});
