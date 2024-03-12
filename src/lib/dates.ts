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
