import estimateTaxAmount, { FilingStatus } from '../../src/lib/tax-brackets.js';
import { test } from 'tap';

/**
 * Uses 2023 IRS tax brackets and std deductions
 * Data source: https://www.nerdwallet.com/article/taxes/federal-income-tax-brackets
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
  const data = estimateTaxAmount(FilingStatus.HoH, 112500);
  t.equal(data.tax_owed, 13875);
});

test('correctly evaluates scenerio: $53,100 single', async t => {
  const data = estimateTaxAmount(FilingStatus.Single, 53100);
  t.equal(data.tax_owed, 4490);
});

test('correctly evaluates scenerio: $300,000 hoh', async t => {
  const data = estimateTaxAmount(FilingStatus.HoH, 300000);
  t.equal(data.tax_owed, 68008);
});

test('correctly evaluates scenerio: $300,000 single', async t => {
  const data = estimateTaxAmount(FilingStatus.Single, 300000);
  t.equal(data.tax_owed, 72047);
});

test('correctly evaluates scenerio: $94,000 joint', async t => {
  const data = estimateTaxAmount(FilingStatus.Joint, 94000);
  t.equal(data.tax_owed, 7516);
});

test('correctly evaluates scenerio: $1,000,000 joint', async t => {
  const data = estimateTaxAmount(FilingStatus.Joint, 1000000);
  t.equal(data.tax_owed, 289665);
});

test('correctly evaluates scenerio: $8,000 single', async t => {
  const data = estimateTaxAmount(FilingStatus.Single, 8000);
  t.equal(data.tax_owed, 0);
});

test('correctly evaluates income at standard deduction', async t => {
  const data = estimateTaxAmount(FilingStatus.Joint, 13850);
  t.equal(data.tax_owed, 0);
});

test('correctly evaluates income below standard deduction', async t => {
  const data = estimateTaxAmount(FilingStatus.Joint, 5000);
  t.equal(data.tax_owed, 0);
});

test('correctly evaluates $0 income', async t => {
  const data = estimateTaxAmount(FilingStatus.Single, 0);
  t.equal(data.tax_owed, 0);
});