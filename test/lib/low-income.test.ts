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

const AMI_AND_EVCREDIT: AMIAndEVCreditEligibility = {
  computedAMI80: 0,
  computedAMI150: 0,
  evCreditEligible: false,
};

const VT_LOCATION: ResolvedLocation = {
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

  // Effective threshold for hhsize 1 = 10000
  t.ok(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 1, household_income: 9999 },
      thresholds,
      VT_LOCATION,
      AMI_AND_EVCREDIT,
    ),
  );
  t.notOk(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 1, household_income: 10001 },
      thresholds,
      VT_LOCATION,
      AMI_AND_EVCREDIT,
    ),
  );

  // Effective threshold for hhsize 2 = 19000
  t.ok(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 2, household_income: 18999 },
      thresholds,
      VT_LOCATION,
      AMI_AND_EVCREDIT,
    ),
  );
  t.notOk(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 2, household_income: 19001 },
      thresholds,
      VT_LOCATION,
      AMI_AND_EVCREDIT,
    ),
  );
});

test('federal poverty level', async t => {
  const thresholds: LowIncomeThresholdsAuthority = {
    type: 'fpl-percentage',
    thresholds: {
      percentage: 100,
    },
    source_url: '',
    incentives: [],
  };

  // Explicit threshold for hhsize 1 in mainland
  t.ok(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 1, household_income: 15649 },
      thresholds,
      VT_LOCATION,
      AMI_AND_EVCREDIT,
    ),
  );
  t.notOk(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 1, household_income: 15651 },
      thresholds,
      VT_LOCATION,
      AMI_AND_EVCREDIT,
    ),
  );

  // Calculated threshold for hhsize 10 in mainland
  // 54150 (for 8 people) plus 5500 x 2 (for 2 additional) = 65150
  t.ok(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 10, household_income: 65149 },
      thresholds,
      VT_LOCATION,
      AMI_AND_EVCREDIT,
    ),
  );
  t.notOk(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 10, household_income: 65151 },
      thresholds,
      VT_LOCATION,
      AMI_AND_EVCREDIT,
    ),
  );

  const AK_LOCATION = {
    state: 'AK',
    zcta: '99501',
    // Not relevant for this test
    geographies: [],
  };

  // Explicit threshold for hhsize 1 in AK
  t.ok(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 1, household_income: 19549 },
      thresholds,
      AK_LOCATION,
      AMI_AND_EVCREDIT,
    ),
  );
  t.notOk(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 1, household_income: 19551 },
      thresholds,
      AK_LOCATION,
      AMI_AND_EVCREDIT,
    ),
  );

  // FPL not defined in territories; result is false no matter what
  t.notOk(
    isLowIncome(
      { ...BASE_PARAMS, household_size: 1, household_income: 0 },
      thresholds,
      { state: 'PR', zcta: '00601', geographies: [] },
      AMI_AND_EVCREDIT,
    ),
  );
});
