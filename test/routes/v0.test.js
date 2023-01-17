import { test } from 'tap';
import { build } from '../helper.js';
import Ajv from 'ajv';
import fs from 'fs';

async function getCalculatorResponse(t, query) {
  const app = await build(t);

  const searchParams = new URLSearchParams(query);
  const url = `/api/v0/calculator?${searchParams}`;

  const res = await app.inject({ url });

  return res;
}

test('response is valid and correct', async (t) => {
  const res = await getCalculatorResponse(t, {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  });
  const calculatorResponse = JSON.parse(res.payload);

  // NOTE: path is relative to test command, not this file (apparently)
  const incentiveSchema = JSON.parse(fs.readFileSync('./schemas/website/incentive.json', 'utf-8'));
  const responseSchema = JSON.parse(fs.readFileSync('./schemas/website/calculator-response.json', 'utf-8'));

  const ajv = new Ajv({
    schemas: [incentiveSchema, responseSchema],
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    allErrors: false
  });

  const responseValidator = ajv.getSchema('WebsiteCalculatorResponse');

  // validate the response is a WebsiteCalculatorResponse
  const validation = await responseValidator(calculatorResponse);
  t.equal(responseValidator.errors, null);

  t.equal(calculatorResponse.is_under_80_ami, true);
  t.equal(calculatorResponse.is_under_150_ami, true);
  t.equal(calculatorResponse.is_over_150_ami, false);

  t.equal(calculatorResponse.pos_savings, 14000);
  t.equal(calculatorResponse.tax_savings, 6081);
  t.equal(calculatorResponse.performance_rebate_savings, 8000);
  t.equal(calculatorResponse.estimated_annual_savings, 1040);

  t.equal(calculatorResponse.pos_rebate_incentives.length, 8);
  t.equal(calculatorResponse.tax_credit_incentives.length, 10);

  // TODO: test incentives contents and values
});

const BAD_QUERIES = [
  // bad zip:
  { owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { zip: '', owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { zip: 'abc', owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { zip: '1234', owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  // bad owner_status:
  { zip: '80212', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { zip: '80212', owner_status: '', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { zip: '80212', owner_status: 'aaa', household_income: 80000, tax_filing: 'joint', household_size: 4 },
  { zip: '80212', owner_status: -1, household_income: 80000, tax_filing: 'joint', household_size: 4 },
  // bad household_income:
  { zip: '80212', owner_status: 'homeowner', household_income: 0, tax_filing: 'joint', household_size: 4 },
  { zip: '80212', owner_status: 'homeowner', household_income: -1, tax_filing: 'joint', household_size: 4 },
  { zip: '80212', owner_status: 'homeowner', household_income: 100000001, tax_filing: 'joint', household_size: 4 },
  { zip: '80212', owner_status: 'homeowner', tax_filing: 'joint', household_size: 4 },
  // bad tax_filing:
  { zip: '80212', owner_status: 'homeowner', household_income: 80000, household_size: 4 },
  { zip: '80212', owner_status: 'homeowner', household_income: 80000, tax_filing: '', household_size: 4 },
  { zip: '80212', owner_status: 'homeowner', household_income: 80000, tax_filing: 'foo', household_size: 4 },
  { zip: '80212', owner_status: 'homeowner', household_income: 80000, tax_filing: null, household_size: 4 },
  // bad household_size:
  { zip: '80212', owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint' },
  { zip: '80212', owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 0 },
  { zip: '80212', owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 'a' },
  { zip: '80212', owner_status: 'homeowner', household_income: 80000, tax_filing: 'joint', household_size: 9 },
]

test('bad queries', async (t) => {
  t.plan(BAD_QUERIES.length * 3, 'expect 3 assertions per bad query');

  for (let query of BAD_QUERIES) {
    const res = await getCalculatorResponse(t, query);
    const calculatorResponse = JSON.parse(res.payload);
    t.equal(res.statusCode, 400, 'response status is 400');
    t.equal(calculatorResponse.statusCode, 400, 'payload statuscode is 400');
    t.equal(calculatorResponse.error, 'Bad Request', 'payload error is Bad Request');
  }
});
