import Ajv from 'ajv';
import fs from 'fs';
import qs from 'qs';
import { beforeEach, test } from 'tap';
import { API_CALCULATOR_RESPONSE_SCHEMA } from '../../src/schemas/v1/calculator-endpoint';
import { API_INCENTIVE_SCHEMA } from '../../src/schemas/v1/incentive';
import { API_UTILITIES_RESPONSE_SCHEMA } from '../../src/schemas/v1/utilities-endpoint';
import { build } from '../helper';

beforeEach(() => {
  process.setMaxListeners(100);
});

async function getCalculatorResponse(
  t: Tap.Test,
  query: Record<string, unknown>,
) {
  const app = await build(t);

  const searchParams = qs.stringify(query, { encodeValuesOnly: true });
  const url = `/api/v1/calculator?${searchParams}`;

  const res = await app.inject({ url });
  return res;
}

async function validateResponse(
  t: Tap.Test,
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
  t.same(
    calculatorResponse,
    expectedResponse,
    `response does not match ${fixtureFile}`,
  );
}

test('response is valid and correct', async t => {
  await validateResponse(
    t,
    {
      location: { zip: '80212' },
      owner_status: 'homeowner',
      household_income: 80000,
      tax_filing: 'joint',
      household_size: 4,
    },
    './test/fixtures/v1-80212-homeowner-80000-joint-4.json',
  );
});

test('response with state and utility is valid and correct', async t => {
  await validateResponse(
    t,
    {
      location: { zip: '02903' },
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
      location: { zip: '02807' },
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

const BAD_QUERIES = [
  // bad location:
  {
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    location: null,
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    location: {},
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  // bad owner_status:
  {
    location: { zip: '80212' },
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    location: { zip: '80212' },
    owner_status: '',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    location: { zip: '80212' },
    owner_status: 'aaa',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    location: { zip: '80212' },
    owner_status: -1,
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  // bad household_income:
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: null,
    tax_filing: 'joint',
    household_size: 4,
  }, // null is the JSON encoding of NaN
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: -1,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 100000001,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    tax_filing: 'joint',
    household_size: 4,
  },
  // bad tax_filing:
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    household_size: 4,
  },
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: '',
    household_size: 4,
  },
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'foo',
    household_size: 4,
  },
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: null,
    household_size: 4,
  },
  // bad household_size:
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
  },
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 0,
  },
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 'a',
  },
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 9,
  },
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
    // Must pass utility field if authority_types includes "utility"
    authority_types: ['utility'],
  },
  {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
    authority_types: ['utility'],
    utility: 'nonexistent-utility',
  },
  {
    // No state-level coverage in this state yet (CO)
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
    authority_types: ['state'],
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
  // Exists, but is not a ZCTA and has no AMI data
  '02117',
  // Does not exist
  '80088',
];

test('non-existent zips', async t => {
  t.plan(BAD_ZIPS.length * 3);

  for (const zip of BAD_ZIPS) {
    const res = await getCalculatorResponse(t, {
      location: { zip },
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

test('/incentives', async t => {
  const app = await build(t);
  const res = await app.inject({ url: '/api/v1/incentives' });
  const incentivesResponse = JSON.parse(res.payload);
  t.equal(incentivesResponse.incentives.length, 32);
  t.equal(res.statusCode, 200, 'response status is 200');

  const ajv = new Ajv({
    schemas: [{ ...API_INCENTIVE_SCHEMA, $id: 'APIIncentive' }],
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    allErrors: false,
  });

  const validator = ajv.getSchema('APIIncentive')!;

  for (const incentive of incentivesResponse.incentives) {
    await validator(incentive);
    t.equal(validator.errors, null);
  }
});

const UTILITIES = [
  [
    '02807',
    { 'ri-block-island-power-company': { name: 'Block Island Power Company' } },
  ],
  [
    '02814',
    {
      'ri-rhode-island-energy': { name: 'Rhode Island Energy' },
      'ri-pascoag-utility-district': { name: 'Pascoag Utility District' },
    },
  ],
  [
    '02905',
    { 'ri-rhode-island-energy': { name: 'Rhode Island Energy' } },
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

  for (const [zip, expectedResponse] of UTILITIES) {
    const searchParams = qs.stringify(
      { location: { zip } },
      { encodeValuesOnly: true },
    );
    const res = await app.inject({ url: `/api/v1/utilities?${searchParams}` });
    t.equal(res.statusCode, 200);

    const utilitiesResponse = JSON.parse(res.payload);

    await validator(utilitiesResponse);
    t.equal(validator.errors, null);

    t.same(utilitiesResponse, expectedResponse);
  }
});
