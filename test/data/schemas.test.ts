import { test } from 'tap';
import {
  AUTHORITIES_BY_STATE,
  SCHEMA as AUTHORITIES_SCHEMA,
} from '../../src/data/authorities';
import {
  IRA_INCENTIVES,
  SCHEMA as I_SCHEMA,
} from '../../src/data/ira_incentives';
import {
  IRA_STATE_SAVINGS,
  SCHEMA as ISS_SCHEMA,
} from '../../src/data/ira_state_savings';
import { LOCALES, SCHEMA as L_SCHEMA } from '../../src/data/locale';
import {
  LOW_INCOME_THRESHOLDS_BY_AUTHORITY,
  SCHEMA as LOW_INCOME_THRESHOLDS_SCHEMA,
} from '../../src/data/low_income_thresholds';
import { SOLAR_PRICES, SCHEMA as SP_SCHEMA } from '../../src/data/solar_prices';
import {
  CT_INCENTIVES,
  CT_INCENTIVES_SCHEMA,
  NY_INCENTIVES,
  NY_INCENTIVES_SCHEMA,
  RI_INCENTIVES,
  RI_INCENTIVES_SCHEMA,
  StateIncentive,
} from '../../src/data/state_incentives';
import { SCHEMA as SMFI_SCHEMA, STATE_MFIS } from '../../src/data/state_mfi';
import { TAX_BRACKETS, SCHEMA as TB_SCHEMA } from '../../src/data/tax_brackets';

import Ajv from 'ajv/dist/2020';
import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import {
  ALL_PROGRAMS,
  PROGRAMS,
  PROGRAMS_SCHEMA,
} from '../../src/data/programs';
import { LOCALIZABLE_STRING_SCHEMA } from '../../src/data/types/localizable-string';

const TESTS = [
  [I_SCHEMA, IRA_INCENTIVES, 'ira_incentives'],
  [ISS_SCHEMA, IRA_STATE_SAVINGS, 'ira_state_savings'],
  [L_SCHEMA, LOCALES.en, 'en locale'],
  [L_SCHEMA, LOCALES.es, 'es locale'],
  [SP_SCHEMA, SOLAR_PRICES, 'solar_prices'],
  [SMFI_SCHEMA, STATE_MFIS, 'state_mfis'],
  [TB_SCHEMA, TAX_BRACKETS, 'tax_brackets'],
  [AUTHORITIES_SCHEMA, AUTHORITIES_BY_STATE, 'authorities'],
  [PROGRAMS_SCHEMA, PROGRAMS, 'programs'],
  [
    LOW_INCOME_THRESHOLDS_SCHEMA,
    LOW_INCOME_THRESHOLDS_BY_AUTHORITY,
    'State low income',
  ],
];

test('static JSON files match schema', async tap => {
  tap.plan(TESTS.length);
  const ajv = new Ajv({ schemas: [LOCALIZABLE_STRING_SCHEMA] });

  TESTS.forEach(([schema, data, label]) => {
    if (!tap.ok(ajv.validate(schema, data))) {
      console.error(label, ajv.errors);
    }
  });
});

const STATE_INCENTIVE_TESTS: [string, SomeJSONSchema, StateIncentive[]][] = [
  ['CT', CT_INCENTIVES_SCHEMA, CT_INCENTIVES],
  ['NY', NY_INCENTIVES_SCHEMA, NY_INCENTIVES],
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
  const ajv = new Ajv({ schemas: [LOCALIZABLE_STRING_SCHEMA] });

  STATE_INCENTIVE_TESTS.forEach(([stateId, schema, data]) => {
    const authorities = AUTHORITIES_BY_STATE[stateId as string];

    if (!tap.ok(ajv.validate(schema, data), `${stateId} incentives invalid`)) {
      console.error(ajv.errors);
    }

    // Validate that each incentive has a unique ID.
    const incentiveIds = new Set<string>();

    // Check some constraints that aren't expressed in JSON schema
    data.forEach((incentive, index) => {
      tap.ok(
        incentive.short_description.en.length <= 150,
        `${stateId} English description too long ` +
          `(${incentive.short_description.en.length}), index ${index}`,
      );

      // We let Spanish descriptions be a little longer
      if (incentive.short_description.es) {
        tap.ok(
          incentive.short_description.es.length <= 160,
          `${stateId} Spanish description too long ` +
            `(${incentive.short_description.en.length}), index ${index}`,
        );
      }
      tap.ok(
        isIncentiveAmountValid(incentive),
        `amount is invalid (${stateId}, index ${index})`,
      );
      tap.hasProp(
        authorities[incentive.authority_type as 'state' | 'utility'],
        incentive.authority,
        `nonexistent authority (${stateId}, index ${index})`,
      );

      tap.equal(incentiveIds.has(incentive.id), false);
      incentiveIds.add(incentive.id);
    });
  });
});

test('programs in data are exactly those in code', async tap => {
  tap.same(Object.keys(PROGRAMS).sort(), Array.from(ALL_PROGRAMS).sort());
});

const isURLValid = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};
test('all programs have valid URLs', async tap => {
  for (const [programId, data] of Object.entries(PROGRAMS)) {
    for (const url of Object.values(data.url ?? [])) {
      tap.ok(isURLValid(url), `${programId} has invalid URL`);
    }
  }
});

test('locale URLs are valid', async tap => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    for (const [key, url] of Object.entries(locale.urls)) {
      tap.ok(isURLValid(url), `${lang}.urls.${key} invalid`);
    }
  }
});
