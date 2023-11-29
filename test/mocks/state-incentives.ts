import fs from 'fs';
import { StateIncentive } from '../../src/data/state_incentives';

// These are model incentives created for the purpose of testing specific
// aspects of calculator logic. They are not intended to be included with any
// launched data.
export const TEST_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./test/fixtures/test-incentives.json', 'utf-8'),
);
