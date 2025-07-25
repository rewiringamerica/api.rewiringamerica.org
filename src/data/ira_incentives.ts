import fs from 'fs';
import { StateIncentive } from './state_incentives';

export const IRA_INCENTIVES: StateIncentive[] = JSON.parse(
  fs.readFileSync('./data/ira_incentives.json', 'utf-8'),
);
