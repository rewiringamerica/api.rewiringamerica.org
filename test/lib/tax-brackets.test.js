import estimateTaxAmount from '../../lib/tax-brackets.js';
import { test } from 'tap';

test('correctly evaluates scenerio "$300,000 joint"', async (t) => {
  const data = await estimateTaxAmount('joint', 300000);
  t.equal(data.tax_owed, 53455);
});

test('correctly evaluates scenerio "$140,000 joint"', async (t) => {
  const data = await estimateTaxAmount('joint', 140000);
  t.equal(data.tax_owed, 16336);
});

test('correctly evaluates scenerio "$80,000 single"', async (t) => {
  const data = await estimateTaxAmount('single', 80000);
  t.equal(data.tax_owed, 10368);
});
