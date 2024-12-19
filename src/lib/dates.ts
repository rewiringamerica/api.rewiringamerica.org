import { LocalDate, YearMonth } from '@js-joda/core';

/**
 * This allows representing the start or end date of an incentive at the
 * granularity of:
 *
 * - A whole year
 * - The first or second half of a year
 * - One of the quarters of a year
 * - A month
 * - A specific day
 *
 * It enforces that months are between 01 and 12, and days are between 01 and
 * 31, but not that the month/day combos are possible (e.g. it will pass
 * 2024-09-31).
 */
export const START_END_DATE_REGEX =
  /^\d{4}(H[12]|Q[1-4]|-(0[1-9]|1[0-2])(-(0[1-9]|1[0-9]|2[0-9]|3[01]))?)?$/;

/**
 * Returns a LocalDate representing the last possible day of the period denoted
 * by the given start/end date string. Assumes that the given string matches the
 * regex above.
 */
export function lastDayOf(incentiveDate: string): LocalDate {
  const quarterHalfMatch = incentiveDate.match(/(\d{4})(Q[1-4]|H[1-2])/);
  if (quarterHalfMatch) {
    const year = parseInt(quarterHalfMatch[1]);
    switch (quarterHalfMatch[2]) {
      case 'Q1':
        return LocalDate.of(year, 3, 31);
      case 'Q2':
      case 'H1':
        return LocalDate.of(year, 6, 30);
      case 'Q3':
        return LocalDate.of(year, 9, 30);
      case 'Q4':
      case 'H2':
        return LocalDate.of(year, 12, 31);
    }
  }

  // Now it must be a normal, partial ISO 8601 date
  const components = incentiveDate.split('-').map(n => parseInt(n));

  switch (components.length) {
    case 1:
      return LocalDate.of(components[0], 12, 31);
    case 2:
      return YearMonth.of(components[0], components[1]).atEndOfMonth();
    case 3:
      return LocalDate.of(components[0], components[1], components[2]);
  }

  // Should not get here if START_END_DATE_REGEX precondition holds
  throw new Error(`Invalid end date ${incentiveDate}`);
}

/**
 * Returns a LocalDate representing the first possible day of the period denoted
 * by the given start/end date string. Assumes that the given string matches the
 * regex above.
 */
export function firstDayOf(incentiveDate: string): LocalDate {
  const quarterHalfMatch = incentiveDate.match(/(\d{4})(Q[1-4]|H[1-2])/);
  if (quarterHalfMatch) {
    const year = parseInt(quarterHalfMatch[1]);
    switch (quarterHalfMatch[2]) {
      case 'Q1':
      case 'H1':
        return LocalDate.of(year, 1, 1);
      case 'Q2':
        return LocalDate.of(year, 4, 1);
      case 'Q3':
      case 'H2':
        return LocalDate.of(year, 7, 1);
      case 'Q4':
        return LocalDate.of(year, 10, 1);
    }
  }

  // Now it must be a normal, partial ISO 8601 date
  const components = incentiveDate.split('-').map(n => parseInt(n));

  switch (components.length) {
    case 1:
      return LocalDate.of(components[0], 1, 1);
    case 2:
      return YearMonth.of(components[0], components[1]).atDay(1);
    case 3:
      return LocalDate.of(components[0], components[1], components[2]);
  }

  // Should not get here if START_END_DATE_REGEX precondition holds
  throw new Error(`Invalid start date ${incentiveDate}`);
}
