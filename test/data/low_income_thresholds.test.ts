import { test } from 'tap';
import { LOW_INCOME_THRESHOLDS_BY_STATE } from '../../src/data/low_income_thresholds';
import {
  STATE_INCENTIVES_BY_STATE,
  StateIncentive,
} from '../../src/data/state_incentives';

function computeIdToIncentiveMap(incentives: StateIncentive[]) {
  const output: { [index: string]: StateIncentive } = {};
  for (const incentive of incentives) {
    output[incentive.id] = incentive;
  }
  return output;
}

test('low-income thresholds are equivalent in JSON config and incentives', async t => {
  // All incentives have the threshold indicated in their config.
  const map = computeIdToIncentiveMap(
    Object.values(STATE_INCENTIVES_BY_STATE).flat(),
  );
  Object.entries(LOW_INCOME_THRESHOLDS_BY_STATE).forEach(
    ([, stateThresholds]) => {
      for (const [identifier, thresholds] of Object.entries(stateThresholds)) {
        for (const incentiveId of thresholds.incentives) {
          const incentive = map[incentiveId];
          if (incentive) {
            t.equal(incentive.low_income, identifier);
          } else {
            t.fail(
              `low income thresholds ${identifier} reference nonexistent ` +
                `incentive ${incentiveId}`,
            );
          }
        }
      }
    },
  );
  // Converse: all threshold configs accurately reflect the incentive IDs.
  for (const [stateId, stateIncentives] of Object.entries(
    STATE_INCENTIVES_BY_STATE,
  )) {
    for (const incentive of stateIncentives) {
      if (incentive.low_income) {
        const stateThresholds = LOW_INCOME_THRESHOLDS_BY_STATE[stateId];
        t.hasProp(stateThresholds, incentive.low_income);
        t.ok(
          stateThresholds[incentive.low_income].incentives.includes(
            incentive.id,
          ),
        );
      }
    }
  }
});

test('low-income thresholds have HH sizes 1-8', async t => {
  const hasRequiredKeys = (obj: Record<string, unknown>) => {
    const keys = Object.keys(obj);
    return [1, 2, 3, 4, 5, 6, 7, 8].every(num => keys.includes(num.toString()));
  };

  for (const stateThresholds of Object.values(LOW_INCOME_THRESHOLDS_BY_STATE)) {
    for (const [key, thresholds] of Object.entries(stateThresholds)) {
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
  }
});

test('filing-status thresholds have consistent min and max', async t => {
  for (const stateThresholds of Object.values(LOW_INCOME_THRESHOLDS_BY_STATE)) {
    for (const thresholds of Object.values(stateThresholds)) {
      if (thresholds.type === 'filing-status') {
        for (const statusThresholds of Object.values(thresholds.thresholds)) {
          const [min, max] = statusThresholds;
          t.ok(min < max);
        }
      }
    }
  }
});
