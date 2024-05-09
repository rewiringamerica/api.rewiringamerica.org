import { StateStatus } from '../../data/types/state-status';
import { STATES_PLUS_DC } from '../../data/types/states';

export const API_STATES_RESPONSE_SCHEMA = {
  $id: 'APIStatesResponse',
  type: 'object',
  properties: Object.fromEntries(
    STATES_PLUS_DC.map(state => [
      state,
      {
        type: 'object',
        properties: {
          status: { type: 'string', enum: Object.values(StateStatus) },
        },
      },
    ]),
  ),
  additionalProperties: false,
};

export const API_STATES_SCHEMA = {
  description: 'What is the rollout status of each state?',
  response: {
    200: {
      ...API_STATES_RESPONSE_SCHEMA,
    },
    400: {
      $ref: 'Error',
    },
  },
} as const;
