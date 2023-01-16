import { test } from 'tap';
import { build } from '../helper.js';
import Ajv from 'ajv';
import fs from 'fs';

// NOTE: path is relative to test command, not this file (apparently)
const incentiveSchema = JSON.parse(fs.readFileSync('./schemas/website/incentive.json', 'utf-8'));
const responseSchema = JSON.parse(fs.readFileSync('./schemas/website/calculator-response.json', 'utf-8'));

test('example is valid and correct', async (t) => {
  const app = await build(t);

  const res = await app.inject({
    url: '/api/v0/calculator?zip=80212&owner_status=homeowner&household_income=80000&tax_filing=joint&household_size=4'
  });
  const calculatorResponse = JSON.parse(res.payload);

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
