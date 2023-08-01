import { test } from 'tap';
import {
  SCHEMA as I_SCHEMA,
  IRA_INCENTIVES,
} from '../../src/data/ira_incentives.js';
import {
  SCHEMA as ISS_SCHEMA,
  IRA_STATE_SAVINGS,
} from '../../src/data/ira_state_savings.js';
import { SCHEMA as L_SCHEMA, LOCALES } from '../../src/data/locale.js';
import {
  SCHEMA as SP_SCHEMA,
  SOLAR_PRICES,
} from '../../src/data/solar_prices.js';
import { SCHEMA as SMFI_SCHEMA, STATE_MFIS } from '../../src/data/state_mfi.js';
import {
  SCHEMA as TB_SCHEMA,
  TAX_BRACKETS,
} from '../../src/data/tax_brackets.js';
import {
  SCHEMA as AUTHORITIES_SCHEMA,
  AUTHORITIES_BY_STATE,
} from '../../src/data/authorities.js';
import {
  SCHEMA as RI_LOW_INCOME_THRESHOLDS_SCHEMA,
  RI_LOW_INCOME_THRESHOLDS,
} from '../../src/data/RI/low_income_thresholds.js';
import {
  RI_INCENTIVES,
  RI_INCENTIVES_SCHEMA,
  StateIncentive,
} from '../../src/data/state_incentives.js';

import Ajv from 'ajv';
import { SomeJSONSchema } from 'ajv/dist/types/json-schema.js';

const TESTS = [
  [I_SCHEMA, IRA_INCENTIVES],
  [ISS_SCHEMA, IRA_STATE_SAVINGS],
  [L_SCHEMA, LOCALES.en],
  [L_SCHEMA, LOCALES.es],
  [SP_SCHEMA, SOLAR_PRICES],
  [SMFI_SCHEMA, STATE_MFIS],
  [TB_SCHEMA, TAX_BRACKETS],
  [AUTHORITIES_SCHEMA, AUTHORITIES_BY_STATE],
  [RI_LOW_INCOME_THRESHOLDS_SCHEMA, RI_LOW_INCOME_THRESHOLDS],
];

test('static JSON files match schema', async tap => {
  tap.plan(TESTS.length);
  // Workaround for https://github.com/ajv-validator/ajv/issues/2047
  const ajv = new Ajv.default();

  TESTS.forEach(([schema, data]) => {
    if (!tap.ok(ajv.validate(schema, data))) {
      console.error(ajv.errors);
    }
  });
});

const STATE_INCENTIVE_TESTS: [string, SomeJSONSchema, StateIncentive[]][] = [
  ['RI', RI_INCENTIVES_SCHEMA, RI_INCENTIVES],
];

/**
 * Checks some invariants of incentives that aren't expressible in schemas.
 */
function isIncentiveAmountValid<T extends StateIncentive>(
  incentive: T,
): boolean {
  // Validate the amount has the right properties given its type.
  const { amount } = incentive;
  switch (amount.type) {
    case 'dollar_amount':
      return !amount.unit && !amount.representative;
    case 'percent':
      return amount.number >= 0 && amount.number <= 1 && !amount.unit;
    case 'dollars_per_unit':
      return amount.unit !== undefined;
    default:
      return false;
  }
}

test('state incentives JSON files match schemas', async tap => {
  const ajv = new Ajv.default();

  STATE_INCENTIVE_TESTS.forEach(([stateId, schema, data]) => {
    const authorities = AUTHORITIES_BY_STATE[stateId as string];

    if (!tap.ok(ajv.validate(schema, data), `${stateId} incentives invalid`)) {
      console.error(ajv.errors);
    }

    // Check some constraints that aren't expressed in JSON schema
    data.forEach((incentive, index) => {
      tap.ok(
        isIncentiveAmountValid(incentive),
        `amount is invalid (${stateId}, index ${index})`,
      );
      tap.hasProp(
        authorities[incentive.authority_type as 'state' | 'utility'],
        incentive.authority,
        `nonexistent authority (${stateId}, index ${index})`,
      );
    });
  });
});
