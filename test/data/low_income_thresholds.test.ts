import { test } from 'tap';
import { LOW_INCOME_THRESHOLDS_BY_AUTHORITY } from '../../src/data/low_income_thresholds';
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
  Object.entries(LOW_INCOME_THRESHOLDS_BY_AUTHORITY).forEach(
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
        const stateThresholds = LOW_INCOME_THRESHOLDS_BY_AUTHORITY[stateId];
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
