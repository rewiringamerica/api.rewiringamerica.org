import Ajv from 'ajv';
import fs from 'fs';
import qs from 'qs';
import { beforeEach, test, Test } from 'tap';
import { API_CALCULATOR_RESPONSE_SCHEMA } from '../../src/schemas/v1/calculator-endpoint';
import { API_INCENTIVE_SCHEMA } from '../../src/schemas/v1/incentive';
import { API_UTILITIES_RESPONSE_SCHEMA } from '../../src/schemas/v1/utilities-endpoint';
import { build } from '../helper';

beforeEach(() => {
  process.setMaxListeners(100);
});

async function getCalculatorResponse(t: Test, query: Record<string, unknown>) {
  const app = await build(t);

  const searchParams = qs.stringify(query, { encodeValuesOnly: true });
  const url = `/api/v1/calculator?${searchParams}`;

  const res = await app.inject({ url });
  return res;
}

async function validateResponse(
  t: Test,
  query: Record<string, unknown>,
  fixtureFile: string,
) {
  const res = await getCalculatorResponse(t, query);
  t.equal(res.statusCode, 200);

  const calculatorResponse = JSON.parse(res.payload);

  const ajv = new Ajv({
    schemas: [API_INCENTIVE_SCHEMA, API_CALCULATOR_RESPONSE_SCHEMA],
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    allErrors: false,
  });

  const responseValidator = ajv.getSchema('APICalculatorResponse')!;

  // validate the response is an APICalculatorResponse
  await responseValidator(calculatorResponse);
  t.equal(responseValidator.errors, null);

  // Verify the specific content of the response
  const expectedResponse = JSON.parse(fs.readFileSync(fixtureFile, 'utf-8'));
  t.strictSame(
    calculatorResponse,
    expectedResponse,
    `response does not match ${fixtureFile}`,
  );
}

test('response is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '80212',
      owner_status: 'homeowner',
      household_income: 80000,
      tax_filing: 'joint',
      household_size: 4,
    },
    './test/fixtures/v1-80212-homeowner-80000-joint-4.json',
  );

  // Same request but with location passed differently
  await validateResponse(
    t,
    {
      zip: '80212',
      owner_status: 'homeowner',
      household_income: 80000,
      tax_filing: 'joint',
      household_size: 4,
    },
    './test/fixtures/v1-80212-homeowner-80000-joint-4.json',
  );
});

test('parent ZCTA is used', async t => {
  await validateResponse(
    t,
    {
      // This does not correspond to physical land area, but its parent ZCTA
      // is 15213, which does.
      zip: '15289',
      owner_status: 'homeowner',
      household_income: 80000,
      tax_filing: 'joint',
      household_size: 4,
    },
    './test/fixtures/v1-15289-homeowner-80000-joint-4.json',
  );
});

test('response with state and utility is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '02903',
      owner_status: 'homeowner',
      // Qualifies as low-income for RI DHS but not Rhode Island Energy.
      household_size: 4,
      household_income: 65000,
      tax_filing: 'joint',
      authority_types: ['state', 'utility'],
      utility: 'ri-rhode-island-energy',
    },
    './test/fixtures/v1-02903-state-utility-lowincome.json',
  );
});

test('response with state and item filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '02807',
      owner_status: 'homeowner',
      household_size: 4,
      household_income: 65000,
      tax_filing: 'joint',
      authority_types: ['federal', 'state'],
      items: ['heat_pump_air_conditioner_heater', 'new_electric_vehicle'],
    },
    './test/fixtures/v1-02807-state-items.json',
  );
});

// AZ low income test for Tuscon Electric utility.
test('AZ low income response with state and utility filtering for Tuscon Electric is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '85701',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 28000,
      tax_filing: 'joint',
      authority_types: ['state', 'utility'],
      utility: 'az-tucson-electric-power',
      // TODO: Remove when AZ is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-az-85701-state-utility-lowincome.json',
  );
});

// AZ low income test for UniSource utility.
test('AZ low income response with state and utility filtering for UniSource is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '85702',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 28000,
      tax_filing: 'joint',
      authority_types: ['state', 'utility'],
      utility: 'az-uni-source-energy-services',
      // TODO: Remove when AZ is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-az-85702-state-utility-lowincome.json',
  );
});

// CO low income test
test('CO low income response with state and utility filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      // Eagle County, which gets Walking Mountains incentives
      zip: '81657',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 100000,
      tax_filing: 'joint',
      authority_types: ['state', 'utility', 'other'],
      utility: 'co-xcel-energy',
      // TODO: Remove when CO is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-co-81657-state-utility-lowincome.json',
  );
});

// CO utility consortium tests
test('CO incentive for PRPA shows up as intended', async t => {
  await validateResponse(
    t,
    {
      zip: '80517',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 80000,
      tax_filing: 'single',
      authority_types: ['state', 'utility', 'other'],
      items: ['heat_pump_water_heater'],
      // Not in PRPA; incentives should not show up
      utility: 'co-xcel-energy',
      // TODO: Remove when CO is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-80517-xcel.json',
  );
  await validateResponse(
    t,
    {
      zip: '80517',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 80000,
      tax_filing: 'joint',
      authority_types: ['state', 'utility', 'other'],
      items: ['heat_pump_water_heater'],
      // Is in PRPA; incentives should show up
      utility: 'co-estes-park-power-and-communications',
      // TODO: Remove when CO is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-80517-estes-park.json',
  );
});

// CT low income test
test('CT low income response with state and utility filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '06002',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 35000,
      tax_filing: 'joint',
      authority_types: ['state', 'utility'],
      utility: 'ct-eversource',
      // TODO: Remove when CT is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-ct-06002-state-utility-lowincome.json',
  );
});

// DC low income test
test('DC low income response with state and city filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '20303',
      owner_status: 'homeowner',
      household_size: 4,
      household_income: 95796,
      tax_filing: 'joint',
      authority_types: ['state', 'city'],
      authority: 'dc-dc-sustainable-energy-utility',
      // TODO: Remove when DC is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-dc-20303-state-city-lowincome.json',
  );
});

// GA Georgia Power test
test('GA response with utility filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '30033',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 35000,
      tax_filing: 'joint',
      authority_types: ['utility'],
      utility: 'ga-georgia-power',
      // TODO: Remove when GA is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-ga-30033-utility.json',
  );
});

// IL low income test
test('IL low income response with state and utility filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '60304',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 35000,
      tax_filing: 'joint',
      authority_types: ['state'],
      authority: 'il-state-of-illinois',
      // TODO: Remove when IL is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/il-60304-state-utility-lowincome.json',
  );
});

// MI low income test.
test('MI response with state and utility is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '48103',
      owner_status: 'homeowner',
      // Qualifies as low-income for MI DTE.
      household_size: 1,
      household_income: 50000,
      tax_filing: 'joint',
      authority_types: ['utility'],
      utility: 'mi-dte',
      include_beta_states: true,
    },
    './test/fixtures/v1-mi-48103-state-utility-lowincome.json',
  );
});

// NV low income test
test('NV low income response with state and utility filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '89108',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 40000,
      tax_filing: 'joint',
      authority_types: ['utility'],
      utility: 'nv-nv-energy',
      // TODO: Remove when NV is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-nv-89108-state-utility-lowincome.json',
  );
});

// OR low income test
test('OR low income response with state and utility filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '97001',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 50000,
      tax_filing: 'joint',
      authority_types: ['state'],
      authority: 'or-energy-trust-of-oregon',
      // TODO: Remove when OR is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-or-97001-state-lowincome.json',
  );
});

// PA low income test
test('PA low income response with state and utility filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '17555',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 20000,
      tax_filing: 'joint',
      authority_types: ['state', 'utility', 'other'],
      utility: 'pa-met-ed',
      // TODO: Remove when PA is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-pa-17555-state-lowincome.json',
  );
});

// NY low income test.
test('NY response with state and utility is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '11557',
      owner_status: 'homeowner',
      // Qualifies as low-income for NY PSEG Long Island utility.
      household_size: 1,
      household_income: 50000,
      tax_filing: 'joint',
      authority_types: ['state', 'utility'],
      utility: 'ny-pseg-long-island',
      include_beta_states: true,
    },
    './test/fixtures/v1-ny-11557-state-utility-lowincome.json',
  );
});

// VA low income test
test('VA low income response with state and utility filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '22030',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 40000,
      tax_filing: 'joint',
      authority_types: ['state', 'utility'],
      utility: 'va-dominion-energy',
      // TODO: Remove when VA is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-va-22030-state-utility-lowincome.json',
  );
});

// VT low income test
test('VT low income response with state and utility filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '05401',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 40000,
      tax_filing: 'joint',
      authority_types: ['state', 'utility'],
      utility: 'vt-burlington-electric-department',
      // TODO: Remove when VT is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-vt-05401-state-utility-lowincome.json',
  );
});

// WI low income test
test('WI low income response with state and utility filtering is valid and correct', async t => {
  await validateResponse(
    t,
    {
      zip: '53703',
      owner_status: 'homeowner',
      household_size: 1,
      household_income: 50000,
      tax_filing: 'joint',
      authority_types: ['state', 'other'],
      authority: 'wi-focus-on-energy',
      utility: 'wi-madison-gas-and-electric',
      // TODO: Remove when WI is fully launched.
      include_beta_states: true,
    },
    './test/fixtures/v1-wi-53703-state-utility-lowincome.json',
  );
});

const BAD_QUERIES = [
  // bad location:
  {
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: null,
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: {},
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  // bad owner_status:
  {
    zip: '80212',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: '80212',
    owner_status: '',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: '80212',
    owner_status: 'aaa',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: '80212',
    owner_status: -1,
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  // bad household_income:
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: null,
    tax_filing: 'joint',
    household_size: 4,
  }, // null is the JSON encoding of NaN
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: -1,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 100000001,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    tax_filing: 'joint',
    household_size: 4,
  },
  // bad tax_filing:
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    household_size: 4,
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: '',
    household_size: 4,
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'foo',
    household_size: 4,
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: null,
    household_size: 4,
  },
  // bad household_size:
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 0,
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 'a',
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 9,
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
    // Must pass utility field if authority_types includes "utility"
    authority_types: ['utility'],
  },
  {
    zip: '02861',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
    // If you pass a utility, it must exist in the state "location" is in
    utility: 'nonexistent-utility',
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
    // We don't have coverage in 80212 (Colorado)
    utility: 'ri-rhode-island-energy',
  },
];

test('bad queries', async t => {
  t.plan(BAD_QUERIES.length * 3, 'expect 3 assertions per bad query');

  for (const query of BAD_QUERIES) {
    const res = await getCalculatorResponse(t, query);
    const calculatorResponse = JSON.parse(res.payload);
    t.equal(
      res.statusCode,
      400,
      `response status is 400 for ${JSON.stringify(query)}`,
    );
    t.equal(
      calculatorResponse.statusCode,
      400,
      `payload statusCode is 400 for ${JSON.stringify(query)}`,
    );
    t.equal(
      calculatorResponse.error,
      'Bad Request',
      `payload error is Bad Request for ${JSON.stringify(query)}`,
    );
  }
});

const BAD_ZIPS = [
  // Exists, but is not a ZCTA and has no parent ZCTA
  '96669',
  // Does not exist
  '80088',
];

test('non-existent zips', async t => {
  t.plan(BAD_ZIPS.length * 3);

  for (const zip of BAD_ZIPS) {
    const res = await getCalculatorResponse(t, {
      zip,
      owner_status: 'homeowner',
      household_income: 0,
      household_size: 1,
      tax_filing: 'single',
    });
    const calculatorResponse = JSON.parse(res.payload);
    t.equal(res.statusCode, 404, 'response status is 404');
    t.equal(calculatorResponse.statusCode, 404, 'payload statusCode is 404');
    t.equal(
      calculatorResponse.error,
      'Not Found',
      'payload error is Not Found',
    );
  }
});

const UTILITIES = [
  [
    '02807',
    false,
    {
      location: { state: 'RI' },
      utilities: {
        'ri-block-island-power-company': { name: 'Block Island Power Company' },
      },
    },
  ],
  [
    '02814',
    false,
    {
      location: { state: 'RI' },
      utilities: {
        'ri-rhode-island-energy': { name: 'Rhode Island Energy' },
        'ri-pascoag-utility-district': { name: 'Pascoag Utility District' },
      },
    },
  ],
  [
    '02905',
    false,
    {
      location: { state: 'RI' },
      utilities: { 'ri-rhode-island-energy': { name: 'Rhode Island Energy' } },
    },
  ],
  [
    '06360',
    true,
    {
      location: { state: 'CT' },
      utilities: {
        'ct-bozrah-light-and-power-company': {
          name: 'Bozrah Light & Power Company',
        },
        'ct-norwich-public-utilities': {
          name: 'Norwich Public Utilities',
        },
        'ct-eversource': {
          name: 'Eversource',
        },
      },
    },
  ],
  ['06360', false, { location: { state: 'CT' }, utilities: {} }],
  [
    '80212',
    false,
    {
      location: { state: 'CO' },
      utilities: {},
    },
  ],
];

test('/utilities', async t => {
  const app = await build(t);
  const ajv = new Ajv({
    schemas: [API_UTILITIES_RESPONSE_SCHEMA],
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    allErrors: false,
  });
  const validator = ajv.getSchema('APIUtilitiesResponse')!;

  for (const [zip, beta, expectedResponse] of UTILITIES) {
    const searchParams = qs.stringify(
      { zip, include_beta_states: beta },
      { encodeValuesOnly: true },
    );
    const res = await app.inject({ url: `/api/v1/utilities?${searchParams}` });
    t.equal(res.statusCode, 200);

    const utilitiesResponse = JSON.parse(res.payload);

    await validator(utilitiesResponse);
    t.equal(validator.errors, null);

    t.strictSame(utilitiesResponse, expectedResponse);
  }
});
