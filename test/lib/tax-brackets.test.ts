import _ from 'lodash';
import { test } from 'tap';
import { FilingStatus, TAX_BRACKETS } from '../../src/data/tax_brackets';
import {
  estimateFederalTaxAmount,
  estimateStateTaxAmount,
} from '../../src/lib/tax-brackets';

/**
 * test `estimateStateTaxAmount`, which calculates tax owed to states
 */
test('correctly determines Colorado state tax liability', async t => {
  const data = estimateStateTaxAmount(100000, 'CO');
  t.equal(data?.taxOwed, 4400);
  t.equal(data?.effectiveRate, 4.4);
});

test('defaults to a null state tax obligation for unsupported states', async t => {
  const data = estimateStateTaxAmount(100000, 'DC');
  t.equal(data, null);
});

/**
 * Uses 2023 IRS tax brackets and std deductions
 * Data source: https://www.irs.gov/pub/irs-drop/rp-22-38.pdf
 *
 * Formula to calculate tax owed to write tests:
 * * Choose an amount and filing status (single, joint, hoh)
 * * Find the standard deduction for that filing status (https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2023)
 * * Use the following formula:
 *
 * (%INCOME%-%STANDARD DEDUCTION%-%MAX INCOME FOR PREVIOUS TAX BRACKET%)*%TAX BRACKET%+%FIXED TAX AMOUNT FOR PREVIOUS NON-MARGINAL TAX BRACKET%
 *
 */

test('correctly evaluates scenerio: $112,500 hoh', async t => {
  const data = estimateFederalTaxAmount(FilingStatus.HoH, 112500);
  t.equal(data.taxOwed, 13875);
});

test('correctly evaluates scenerio: $53,100 single', async t => {
  const data = estimateFederalTaxAmount(FilingStatus.Single, 53100);
  t.equal(data.taxOwed, 4490);
});

test('correctly evaluates scenerio: $300,000 hoh', async t => {
  const data = estimateFederalTaxAmount(FilingStatus.HoH, 300000);
  t.equal(data.taxOwed, 68009);
});

test('correctly evaluates scenerio: $300,000 single', async t => {
  const data = estimateFederalTaxAmount(FilingStatus.Single, 300000);
  t.equal(data.taxOwed, 72047);
});

test('correctly evaluates scenerio: $94,000 joint', async t => {
  const data = estimateFederalTaxAmount(FilingStatus.Joint, 94000);
  t.equal(data.taxOwed, 7516);
});

test('correctly evaluates scenerio: $1,000,000 joint', async t => {
  const data = estimateFederalTaxAmount(FilingStatus.Joint, 1000000);
  t.equal(data.taxOwed, 289665);
});

test('correctly evaluates scenerio: $8,000 single', async t => {
  const data = estimateFederalTaxAmount(FilingStatus.Single, 8000);
  t.equal(data.taxOwed, 0);
});

test('correctly evaluates income at standard deduction', async t => {
  const data = estimateFederalTaxAmount(FilingStatus.Joint, 13850);
  t.equal(data.taxOwed, 0);
});

test('correctly evaluates income below standard deduction', async t => {
  const data = estimateFederalTaxAmount(FilingStatus.Joint, 5000);
  t.equal(data.taxOwed, 0);
});

test('correctly evaluates $0 income', async t => {
  const data = estimateFederalTaxAmount(FilingStatus.Single, 0);
  t.equal(data.taxOwed, 0);
});

test('correctly evaluates scenario: $500,000 married-separate', async t => {
  const data = estimateFederalTaxAmount(
    FilingStatus.MarriedFilingSeparately,
    500000,
  );
  t.equal(data.taxOwed, 144833);
});

test('correctly evaluates scenario: $53,100 married-separate', async t => {
  const data = estimateFederalTaxAmount(
    FilingStatus.MarriedFilingSeparately,
    53100,
  );
  t.equal(data.taxOwed, 4490);
});

test('bracket bounds are well-formed', async t => {
  const byStatus = _.groupBy(TAX_BRACKETS, tb => tb.filing_status);

  for (const [status, brackets] of Object.entries(byStatus)) {
    const sorted = _.sortBy(brackets, tb => tb.income_min);

    // First and last brackets have sentinel values for min and max
    t.equal(sorted[0].income_min, 0, `${status} bracket 0 must start with 0`);
    t.equal(
      sorted[sorted.length - 1].income_max,
      10000000000,
      `${status} last bracket must end with 10000000000`,
    );

    for (let i = 1; i < sorted.length; i++) {
      // Each bracket's min must be the previous one's max plus 1
      t.equal(
        sorted[i].income_min - sorted[i - 1].income_max,
        1,
        `${status} bracket ${i} min is not previous max plus 1`,
      );
    }
  }
});
