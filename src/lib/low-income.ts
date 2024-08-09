import {
  HHSizeThresholds,
  LowIncomeThresholdsAuthority,
} from '../data/low_income_thresholds';
import { AMIAndEVCreditEligibility } from './ami-evcredit-calculation';
import { CalculateParams } from './incentives-calculation';
import { ResolvedLocation } from './location';

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
        : thresholds.thresholds[location.countyFips] ??
          thresholds.thresholds['other'];
    const threshold = bySize?.[household_size];

    // The only way the threshold should be missing is if they are defined by
    // county, the user's county doesn't have thresholds defined, and there's no
    // "other" fallback. (All possible input HH sizes should be present in the
    // data; this is enforced by a unit test.) If the threshold is missing, be
    // conservative and return false (i.e. "not low income").
    return typeof threshold === 'number' && household_income <= threshold;
  } else if (thresholds.type === 'filing-status') {
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
