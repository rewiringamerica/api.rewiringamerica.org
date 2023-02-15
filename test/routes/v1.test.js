import { test, beforeEach } from 'tap';
import { build } from '../helper.js';
import Ajv from 'ajv';
import fs from 'fs';
import qs from 'qs';

// NOTE: path is relative to test command, not this file (apparently)
const incentiveSchema = JSON.parse(fs.readFileSync('./schemas/v1/incentive.json', 'utf-8'));
const responseSchema = JSON.parse(fs.readFileSync('./schemas/v1/calculator-response.json', 'utf-8'));

beforeEach((t) => {
  process.setMaxListeners(100);
});

async function getCalculatorResponse(t, query) {
  const app = await build(t);

  const searchParams = qs.stringify(query, { encodeValuesOnly: true });
  const url = `/api/v1/calculator?${searchParams}`;

  const res = await app.inject({ url });
  return res;
}

test('response is valid and correct', async (t) => {
  const res = await getCalculatorResponse(t, {
    location: { zip: '80212' },
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  });
  t.equal(res.statusCode, 200);

  const calculatorResponse = JSON.parse(res.payload);

  const ajv = new Ajv({
    schemas: [incentiveSchema, responseSchema],
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    allErrors: false
  });

  const responseValidator = ajv.getSchema('APICalculatorResponse');

  // validate the response is an APICalculatorResponse
  const validation = await responseValidator(calculatorResponse);
  t.equal(responseValidator.errors, null);

  t.equal(calculatorResponse.is_under_80_ami, true);
  t.equal(calculatorResponse.is_under_150_ami, true);
  t.equal(calculatorResponse.is_over_150_ami, false);

  t.equal(calculatorResponse.pos_savings, 14000);
  t.equal(calculatorResponse.tax_savings, 5836);
  t.equal(calculatorResponse.performance_rebate_savings, 8000);

  t.equal(calculatorResponse.incentives.length, 18);

  // TODO: once the response format is stable, put a strict fixture here to catch breakage:
  // const expectedResponse = JSON.parse(fs.readFileSync('./test/fixtures/v0-80212-homeowner-80000-joint-4.json', 'utf-8'));
  // t.same(calculatorResponse.pos_rebate_incentives, expectedResponse.pos_rebate_incentives);
  // t.same(calculatorResponse.tax_credit_incentives, expectedResponse.tax_credit_incentives);
});

const BAD_QUERIES = [
  // bad location:
  { owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { zip: '80212', owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { location: null, owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { location: {}, owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  // bad owner_status:
  { location: { zip: '80212' }, household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { location: { zip: '80212' }, owner_status: '', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { location: { zip: '80212' }, owner_status: 'aaa', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { location: { zip: '80212' }, owner_status: -1, household_income: 80000, tax_filing: 'joint', household_size: 4 },
  // bad household_income:
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: null, tax_filing: 'joint', household_size: 4 }, // null is the JSON encoding of NaN
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: -1, tax_filing: 'joint', household_size: 4 },
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: 100000001, tax_filing: 'joint', household_size: 4 },
  { location: { zip: '80212' }, owner_status: 'homeowner', tax_filing: 'joint', household_size: 4 },
  // bad tax_filing:
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: 80000, household_size: 4 },
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: 80000, tax_filing: '', household_size: 4 },
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: 80000, tax_filing: 'foo', household_size: 4 },
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: 80000, tax_filing: null, household_size: 4 },
  // bad household_size:
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint' },
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 0 },
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 'a' },
  { location: { zip: '80212' }, owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 9 },
]

test('bad queries', async (t) => {
  t.plan(BAD_QUERIES.length * 3, 'expect 3 assertions per bad query');

  for (let query of BAD_QUERIES) {
    const res = await getCalculatorResponse(t, query);
    const calculatorResponse = JSON.parse(res.payload);
    t.equal(res.statusCode, 400, 'response status is 400');
    t.equal(calculatorResponse.statusCode, 400, 'payload statusCode is 400');
    t.equal(calculatorResponse.error, 'Bad Request', 'payload error is Bad Request');
  }
});

test('non-existent zips', async (t) => {
  const res = await getCalculatorResponse(t, { location: { zip: '80088' }, owner_status: 'homeowner', household_income: 0, household_size: 1, tax_filing: 'single' });
  const calculatorResponse = JSON.parse(res.payload);
  t.equal(res.statusCode, 404, 'response status is 404');
  t.equal(calculatorResponse.statusCode, 404, 'payload statusCode is 404');
  t.equal(calculatorResponse.error, 'Not Found', 'payload error is Not Found');
});

test('/incentives', async (t) => {
  const app = await build(t);
  const res = await app.inject({ url: '/api/v1/incentives' });
  const incentivesResponse = JSON.parse(res.payload);
  t.equal(incentivesResponse.incentives.length, 30);
  t.equal(res.statusCode, 200, 'response status is 200');

  const ajv = new Ajv({
    schemas: [incentiveSchema],
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    allErrors: false
  });

  const validator = ajv.getSchema('APIIncentive');

  for (var incentive of incentivesResponse.incentives) {
    await validator(incentive);
    t.equal(validator.errors, null);
  }
});
