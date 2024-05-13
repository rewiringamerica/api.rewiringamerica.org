import Ajv from 'ajv';
import fs from 'fs';
import qs from 'qs';
import { beforeEach, test, Test } from 'tap';
import { WEBSITE_CALCULATOR_RESPONSE_SCHEMA } from '../../src/schemas/v0/calculator-response';
import { WEBSITE_INCENTIVE_SCHEMA } from '../../src/schemas/v0/incentive';
import { build } from '../helper';

beforeEach(() => {
  process.setMaxListeners(100);
});

async function getCalculatorResponse(t: Test, query: Record<string, unknown>) {
  const app = await build(t);

  const searchParams = qs.stringify(query, { encodeValuesOnly: true });
  const url = `/api/v0/calculator?${searchParams}`;

  const res = await app.inject({ url });

  return res;
}

test('response is valid and correct', async t => {
  const res = await getCalculatorResponse(t, {
    zip: '80212',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  });
  t.equal(res.statusCode, 200);

  const calculatorResponse = JSON.parse(res.payload);

  const ajv = new Ajv({
    schemas: [WEBSITE_INCENTIVE_SCHEMA, WEBSITE_CALCULATOR_RESPONSE_SCHEMA],
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    allErrors: false,
  });

  const responseValidator = ajv.getSchema('WebsiteCalculatorResponse')!;

  // validate the response is a WebsiteCalculatorResponse
  await responseValidator(calculatorResponse);
  t.equal(responseValidator.errors, null);

  t.equal(calculatorResponse.is_under_80_ami, true);
  t.equal(calculatorResponse.is_under_150_ami, true);
  t.equal(calculatorResponse.is_over_150_ami, false);

  t.equal(calculatorResponse.pos_savings, 14000);
  t.equal(calculatorResponse.tax_savings, 5836);
  t.equal(calculatorResponse.performance_rebate_savings, 8000);
  t.equal(calculatorResponse.estimated_annual_savings, 1040);

  t.equal(calculatorResponse.pos_rebate_incentives.length, 8);
  t.equal(calculatorResponse.tax_credit_incentives.length, 10);

  const expectedResponse = JSON.parse(
    fs.readFileSync(
      './test/fixtures/v0-80212-homeowner-80000-joint-4.json',
      'utf-8',
    ),
  );

  t.strictSame(
    calculatorResponse.pos_rebate_incentives,
    expectedResponse.pos_rebate_incentives,
  );
  t.strictSame(
    calculatorResponse.tax_credit_incentives,
    expectedResponse.tax_credit_incentives,
  );
});

const BAD_QUERIES = [
  // bad zip:
  {
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: '',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: 'abc',
    owner_status: 'homeowner',
    household_income: 80000,
    tax_filing: 'joint',
    household_size: 4,
  },
  {
    zip: '1234',
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
];

test('bad queries', async t => {
  t.plan(BAD_QUERIES.length * 3, 'expect 3 assertions per bad query');

  for (const query of BAD_QUERIES) {
    const res = await getCalculatorResponse(t, query);
    const calculatorResponse = JSON.parse(res.payload);
    t.equal(res.statusCode, 400, 'response status is 400');
    t.equal(calculatorResponse.statusCode, 400, 'payload statusCode is 400');
    t.equal(
      calculatorResponse.error,
      'Bad Request',
      'payload error is Bad Request',
    );
  }
});

test('non-existent zips', async t => {
  const res = await getCalculatorResponse(t, {
    zip: '80088',
    owner_status: 'homeowner',
    household_income: 0,
    household_size: 1,
    tax_filing: 'single',
  });
  const calculatorResponse = JSON.parse(res.payload);
  t.equal(res.statusCode, 404, 'response status is 404');
  t.equal(calculatorResponse.statusCode, 404, 'payload statusCode is 404');
  t.equal(calculatorResponse.error, 'Not Found', 'payload error is Not Found');
  t.equal(calculatorResponse.message, "That ZIP code doesn't exist.");
  t.equal(calculatorResponse.field, 'zip');
});

test('zips with parent ZCTA', async t => {
  const res = await getCalculatorResponse(t, {
    // This ZIP doesn't correspond to physical land area, but its parent ZCTA
    // is 85014, which does.
    zip: '85011',
    owner_status: 'homeowner',
    household_income: 0,
    household_size: 1,
    tax_filing: 'single',
  });
  const calculatorResponse = JSON.parse(res.payload);
  t.equal(res.statusCode, 200, 'response status is 200');
  t.equal(calculatorResponse.pos_rebate_incentives.length, 8);
  t.equal(calculatorResponse.tax_credit_incentives.length, 10);
});

const ESTIMATION_TESTS = [
  [
    {
      zip: '11211',
      owner_status: 'homeowner',
      household_income: 120000,
      tax_filing: 'single',
      household_size: 1,
    },
    1130,
  ],
  [
    {
      zip: '94117',
      owner_status: 'homeowner',
      household_income: 250000,
      tax_filing: 'joint',
      household_size: 4,
    },
    1340,
  ],
  [
    {
      zip: '39503',
      owner_status: 'homeowner',
      household_income: 500000,
      tax_filing: 'married_filing_separately',
      household_size: 8,
    },
    1450,
  ],
  [
    {
      zip: '39503',
      owner_status: 'homeowner',
      household_income: 500000,
      tax_filing: 'hoh',
      household_size: 8,
    },
    1450,
  ],
] as const;

test('estimated savings', async t => {
  t.plan(ESTIMATION_TESTS.length, 'expect 1 assertion per estimate');

  for (const [query, expected_amount] of ESTIMATION_TESTS) {
    const res = await getCalculatorResponse(t, query);
    const calculatorResponse = JSON.parse(res.payload);
    t.equal(calculatorResponse.estimated_annual_savings, expected_amount);
  }
});

test('/incentives', async t => {
  const app = await build(t);
  const res = await app.inject({ url: '/api/v0/incentives' });
  const incentivesResponse = JSON.parse(res.payload);
  t.equal(incentivesResponse.incentives.length, 32);
  t.equal(res.statusCode, 200, 'response status is 200');

  const ajv = new Ajv({
    schemas: [WEBSITE_INCENTIVE_SCHEMA],
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    allErrors: false,
  });

  const validator = ajv.getSchema('WebsiteIncentive')!;

  for (const incentive of incentivesResponse.incentives) {
    await validator(incentive);
    t.equal(validator.errors, null);
  }
});
