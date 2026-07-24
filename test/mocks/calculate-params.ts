import { CalculateParams } from '../../src/lib/incentives-calculation';

// The querystring properties that are optional to callers but have a schema
// `default`, so json-schema-to-ts infers them as required on CalculateParams.
// Spread this into test fixtures to cover them with the same defaults AJV
// would apply at runtime.
export const DEFAULT_CALCULATE_PARAMS = {
  language: 'en',
  include_beta_states: false,
} satisfies Partial<CalculateParams>;
