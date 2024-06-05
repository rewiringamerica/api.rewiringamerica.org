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
        required: ['status'],
        additionalProperties: false,
      },
    ]),
  ),
  additionalProperties: false,
};

export const API_STATES_SCHEMA = {
  summary: 'Get state rollout status',
  description: `For each state (and Washington, DC), return the development \
status of its state-, utility-, and local-level incentive data. (Note that \
federal-level incentive data is available regardless of location.)

\`none\` means that state, local, and utility (SLU) incentives \
for the state are not in the API at all. \`beta\` means that SLU incentives \
have not been fully vetted, and will be returned from \`/api/v1/calculator\` \
only if the \`include_beta_states\` request parameter is true. \`launched\` \
means that SLU incentives are fully vetted and returned in the API.`,
  operationId: 'getStateStatus',
  response: {
    200: {
      ...API_STATES_RESPONSE_SCHEMA,
    },
    400: {
      $ref: 'Error',
    },
  },
} as const;
