import { test } from 'tap';
import { LowIncomeThresholdsAuthority } from '../../src/data/low_income_thresholds';
import { OwnerStatus } from '../../src/data/types/owner-status';
import { AMIAndEVCreditEligibility } from '../../src/lib/ami-evcredit-calculation';
import { GeographyType, ResolvedLocation } from '../../src/lib/location';
import { isLowIncome } from '../../src/lib/low-income';

const BASE_PARAMS = {
  zip: '00000',
  owner_status: OwnerStatus.Homeowner,
} as const;

test('multiple-county case', async t => {
  const thresholds: LowIncomeThresholdsAuthority = {
    type: 'county-hhsize',
    source_url: '',
    incentives: [],
    thresholds: {
      // This should make the combined threshold {1: 10k, 2: 19k}
      '11111': {
        1: 10000,
        2: 20000,
      },
      other: {
        1: 11000,
        2: 19000,
      },
    },
  };

  const location: ResolvedLocation = {
    state: 'VT',
    zcta: '05250',
    geographies: [
      {
        id: 1,
        type: GeographyType.County,
        name: 'county 1',
        state: 'VT',
        county_fips: '11111',
        intersection_proportion: 0.5,
      },
      {
        id: 2,
        type: GeographyType.County,
        name: 'county 2',
        state: 'VT',
        county_fips: '22222',
        intersection_proportion: 0.5,
      },
    ],
  };

  // Not relevant for this test case
  const amiAndEvCredit: AMIAndEVCreditEligibility = {
    computedAMI80: 0,
    computedAMI150: 0,
    evCreditEligible: false,
  };

  // Effective threshold for hhsize 1 = 10000
  t.ok(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 1, household_income: 9999 },
      thresholds,
      location,
      amiAndEvCredit,
    ),
  );
  t.notOk(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 1, household_income: 10001 },
      thresholds,
      location,
      amiAndEvCredit,
    ),
  );

  // Effective threshold for hhsize 2 = 19000
  t.ok(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 2, household_income: 18999 },
      thresholds,
      location,
      amiAndEvCredit,
    ),
  );
  t.notOk(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 2, household_income: 19001 },
      thresholds,
      location,
      amiAndEvCredit,
    ),
  );
});
