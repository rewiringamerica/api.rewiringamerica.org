import { test } from 'tap';
import { build } from '../helper.js';
import Ajv from 'ajv';

test('example is loaded', async (t) => {
  const app = await build(t);

  const res = await app.inject({
    url: '/api/v0/calculator?zip=80212&owner_status=homeowner&household_income=80000&tax_filing=joint&household_size=4'
  });

  // TODO: validate the response is a WebsiteCalculatorResponse

  const response = JSON.parse(res.payload);

  t.equal(response.is_under_80_ami, true);
  t.equal(response.is_under_150_ami, true);
  t.equal(response.is_over_150_ami, false);

  t.equal(response.pos_savings, 14000);
  t.equal(response.tax_savings, 6081);
  t.equal(response.performance_rebate_savings, 8000);
  t.equal(response.estimated_annual_savings, 1040);

  t.equal(response.pos_rebate_incentives.length, 8);
  t.equal(response.tax_credit_incentives.length, 10);
});
