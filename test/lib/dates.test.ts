import { test } from 'tap';
import { START_END_DATE_REGEX } from '../../src/lib/dates';

const VALID_DATES = [
  '2024',
  '2024-09',
  '2024-09-30',
  '2024Q1',
  '2024Q4',
  '2024H1',
];

const INVALID_DATES = [
  '',
  '202',
  '2024/09/30',
  '9/30/2024',
  '09/30/2024',
  '2024-13-01',
  '2024-12-32',
  '2024H3',
  '2024Q5',
  '2024HQ',
  '2024 H1',
  '2024 Q1',
];

test('valid dates match the regex', async t => {
  VALID_DATES.forEach(date => {
    t.ok(START_END_DATE_REGEX.test(date), `${date} should be valid`);
  });
});

test('invalid dates do not match the regex', async t => {
  INVALID_DATES.forEach(date => {
    t.notOk(START_END_DATE_REGEX.test(date), `${date} should be invalid`);
  });
});
