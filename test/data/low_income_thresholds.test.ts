import { test } from 'tap';
import { LOW_INCOME_THRESHOLDS } from '../../src/data/low_income_thresholds';
import { STATE_INCENTIVES_BY_STATE } from '../../src/data/state_incentives';

test('incentives refer to defined thresholds', async t => {
  for (const stateIncentives of Object.values(STATE_INCENTIVES_BY_STATE)) {
    for (const incentive of stateIncentives) {
      if (incentive.low_income) {
        t.hasProp(LOW_INCOME_THRESHOLDS, incentive.low_income);
      }
    }
  }
});

test('low-income thresholds have HH sizes 1-8', async t => {
  const hasRequiredKeys = (obj: Record<string, unknown>) => {
    const keys = Object.keys(obj);
    return [1, 2, 3, 4, 5, 6, 7, 8].every(num => keys.includes(num.toString()));
  };

  for (const [key, thresholds] of Object.entries(LOW_INCOME_THRESHOLDS)) {
    if (thresholds.type === 'hhsize') {
      t.ok(
        hasRequiredKeys(thresholds.thresholds),
        `thresholds ${key} missing hh size(s)`,
      );
    } else if (thresholds.type === 'county-hhsize') {
      for (const [fips, countyThresholds] of Object.entries(
        thresholds.thresholds,
      )) {
        t.ok(
          hasRequiredKeys(countyThresholds),
          `thresholds ${key} county ${fips} misisng hh size(s)`,
        );
      }
    }
  }
});

test('filing-status thresholds have consistent min and max', async t => {
  for (const thresholds of Object.values(LOW_INCOME_THRESHOLDS)) {
    if (thresholds.type === 'filing-status') {
      for (const statusThresholds of Object.values(thresholds.thresholds)) {
        const [min, max] = statusThresholds;
        t.ok(min < max);
      }
    }
  }
});
