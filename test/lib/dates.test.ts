import { LocalDate } from '@js-joda/core';
import { test } from 'tap';
import {
  firstDayOf,
  lastDayOf,
  START_END_DATE_REGEX,
} from '../../src/lib/dates';

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

test('lastDayOf is correct', async t => {
  t.same(lastDayOf('2024'), LocalDate.of(2024, 12, 31));
  t.same(lastDayOf('2024-11'), LocalDate.of(2024, 11, 30));
  t.same(lastDayOf('2024-06-07'), LocalDate.of(2024, 6, 7));

  // Leap days
  t.same(lastDayOf('2024-02'), LocalDate.of(2024, 2, 29));
  t.same(lastDayOf('2025-02'), LocalDate.of(2025, 2, 28));

  t.same(lastDayOf('2024Q1'), LocalDate.of(2024, 3, 31));
  t.same(lastDayOf('2025H2'), LocalDate.of(2025, 12, 31));
});

test('firstDayOf is correct', async t => {
  t.same(firstDayOf('2024'), LocalDate.of(2024, 1, 1));
  t.same(firstDayOf('2024-11'), LocalDate.of(2024, 11, 1));
  t.same(firstDayOf('2024-06-07'), LocalDate.of(2024, 6, 7));

  t.same(firstDayOf('2024Q3'), LocalDate.of(2024, 7, 1));
  t.same(firstDayOf('2025H2'), LocalDate.of(2025, 7, 1));
});
