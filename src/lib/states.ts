import { StateStatus } from '../data/types/state-status';
import {
  BETA_STATES,
  LAUNCHED_STATES,
  STATES_AND_TERRITORIES,
} from '../data/types/states';

export const isStateIncluded = (
  stateId: string,
  includeBeta: boolean,
): boolean =>
  LAUNCHED_STATES.includes(stateId) ||
  (includeBeta && BETA_STATES.includes(stateId));

const getStatus = (state: string) => {
  if (LAUNCHED_STATES.includes(state)) {
    return StateStatus.Launched;
  } else if (BETA_STATES.includes(state)) {
    return StateStatus.Beta;
  }
  return StateStatus.None;
};

export const statesWithStatus = Object.fromEntries(
  STATES_AND_TERRITORIES.map(state => [state, { status: getStatus(state) }]),
);
