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
import Ajv from 'ajv';

const TESTS = [
  [I_SCHEMA, IRA_INCENTIVES],
  [ISS_SCHEMA, IRA_STATE_SAVINGS],
  [L_SCHEMA, LOCALES.en],
  [L_SCHEMA, LOCALES.es],
  [SP_SCHEMA, SOLAR_PRICES],
  [SMFI_SCHEMA, STATE_MFIS],
  [TB_SCHEMA, TAX_BRACKETS],
  [AUTHORITIES_SCHEMA, AUTHORITIES_BY_STATE],
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
