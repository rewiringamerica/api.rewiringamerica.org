import { test, beforeEach } from 'tap';
import fetchAMIsForZip from '../../lib/fetch-amis-for-zip.js';
import calculateIncentives from '../../lib/incentives-calculation.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

beforeEach(async (t) => {
  t.context.db = await open({
    filename: './incentives-api.db',
    driver: sqlite3.Database
  })
});

test('correctly evaluates scenerio "Single w/ $120k Household income"', async (t) => {
  const amisForZip = await (fetchAMIsForZip(t.context.db, '11211'));
  const data = await calculateIncentives(amisForZip, {
    zip: '11211',
    owner_status: 'homeowner',
    household_income: 120000,
    tax_filing: 'single',
    household_size: 1
  });
  t.ok(data);
});

test('correctly evaluates scenerio "Joint w/ 5 persons and $60k Household income"', async (t) => {
  const amisForZip = await (fetchAMIsForZip(t.context.db, '11211'));
  const data = await calculateIncentives(amisForZip, {
    zip: '11211',
    owner_status: 'homeowner',
    household_income: 60000,
    tax_filing: 'joint',
    household_size: 5
  });
  t.ok(data);
});

test('correctly evaluates scenerio "Joint w/ $300k Household income"', async (t) => {
  const amisForZip = await (fetchAMIsForZip(t.context.db, '11211'));
  const data = await calculateIncentives(amisForZip, {
    zip: '11211',
    owner_status: 'homeowner',
    household_income: 300000,
    tax_filing: 'joint',
    household_size: 4
  });
  t.ok(data);
});
