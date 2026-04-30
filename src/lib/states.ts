import { StateStatus } from '../data/types/state-status';
import { LAUNCHED_STATES, STATES_AND_TERRITORIES } from '../data/types/states';

export const isStateIncluded = (
  stateId: string,
  // Ignore beta flag since all states are launched
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _includeBeta: boolean,
): boolean => LAUNCHED_STATES.includes(stateId);

const getStatus = (state: string) => {
  if (LAUNCHED_STATES.includes(state)) {
    return StateStatus.Launched;
  }
  return StateStatus.None;
};

export const statesWithStatus = Object.fromEntries(
  STATES_AND_TERRITORIES.map(state => [state, { status: getStatus(state) }]),
);
