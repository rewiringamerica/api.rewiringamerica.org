import _ from 'lodash';
import {
  HHSizeThresholds,
  LowIncomeThresholdsAuthority,
} from '../data/low_income_thresholds';
import { AMIAndEVCreditEligibility } from './ami-evcredit-calculation';
import { CalculateParams } from './incentives-calculation';
import { GeographyType, ResolvedLocation } from './location';

/**
 * For when thresholds are county-specific, return a set of thresholds with the
 * lowest value for each hhsize over all possible counties.
 */
function getCountyThresholds(
  location: ResolvedLocation,
  thresholds: { [fips: string]: HHSizeThresholds },
): HHSizeThresholds {
  const result: HHSizeThresholds = {};
  const counties = location.geographies.filter(
    geo => geo.type === GeographyType.County,
  );

  for (const county of counties) {
    const countyThresholds =
      thresholds[county.county_fips!] || thresholds['other'] || null;
    if (!countyThresholds) {
      // If the user might be in a county for which we don't have thresholds, be
      // conservative and return no thresholds. Downstream, this will cause the
      // user to be considered NOT to meet the definition of low-income.
      return {};
    }
    for (const [hhsize, amount] of Object.entries(countyThresholds)) {
      if (hhsize in result) {
        result[hhsize] = _.min([amount, result[hhsize]])!;
      } else {
        result[hhsize] = amount;
      }
    }
  }

  return result;
}

/**
 * Chooses the right income threshold and determines whether the given income
 * is below it. Which threshold is chosen is conditioned on household size, and,
 * in some cases, location.
 */
export function isLowIncome(
  { household_size, household_income, tax_filing }: CalculateParams,
  thresholds: LowIncomeThresholdsAuthority,
  location: ResolvedLocation,
  amiAndEvCreditEligibility: AMIAndEVCreditEligibility,
): boolean {
  if (thresholds.type === 'hhsize' || thresholds.type === 'county-hhsize') {
    const bySize: HHSizeThresholds =
      thresholds.type === 'hhsize'
        ? thresholds.thresholds
        : getCountyThresholds(location, thresholds.thresholds);
    const threshold = bySize?.[household_size];

    // The only way the threshold should be missing is if they are defined by
    // county, the user's county doesn't have thresholds defined, and there's no
    // "other" fallback. (All possible input HH sizes should be present in the
    // data; this is enforced by a unit test.) If the threshold is missing, be
    // conservative and return false (i.e. "not low income").
    return typeof threshold === 'number' && household_income <= threshold;
  } else if (thresholds.type === 'filing-status') {
    if (!tax_filing) {
      // If the thresholds are filing-status-dependent but the request didn't
      // include filing status, be conservative and say we don't meet them.
      return false;
    }
    const [min, max] = thresholds.thresholds[tax_filing];
    return household_income >= min && household_income <= max;
  } else if (thresholds.type === 'ami-percentage') {
    const percentage: 80 | 150 = thresholds.thresholds.percentage;
    const threshold =
      percentage === 80
        ? amiAndEvCreditEligibility.computedAMI80
        : percentage === 150
        ? amiAndEvCreditEligibility.computedAMI150
        : // If the percentage is an unknown value, use a negative threshold so
          // all incomes are greater than it.
          -1;

    return household_income <= threshold;
  } else {
    const t: never = thresholds;
    console.error('Unknown income threshold type', t);
    return false;
  }
}
