import { StateStatus } from '../../data/types/state-status';

export const API_STATES_RESPONSE_SCHEMA = {
  $id: 'APIStatesResponse',
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: Object.values(StateStatus) },
    },
    required: ['status'],
    additionalProperties: false,
  },
} as const;

export const API_STATES_SCHEMA = {
  summary: 'Get state rollout status',
  description: `For each state and territory (and Washington, DC), return the \
development status of its state-, utility-, and local-level incentive data. \
(Note that federal-level incentive data is available regardless of location.)

The response's keys are two-letter state or territory codes, as [defined by \
the US Postal Service](https://pe.usps.com/text/pub28/28apb.htm). The response \
includes all 50 states, Washington DC, and the territories of Puerto Rico, \
Guam, American Samoa, the US Virgin Islands, and the Northern Mariana Islands.

In each key's value, the possible \`status\` properties are:

- \`none\`: state, local, and utility (SLU) incentives for the state are not \
in the API at all.
- \`beta\`: SLU incentives have not been fully vetted, and will be returned \
from \`/api/v1/calculator\` only if the \`include_beta_states\` request \
parameter is true.
- \`launched\`: SLU incentives are fully vetted and returned in the API.`,
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
