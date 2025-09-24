import Database from 'better-sqlite3';
import { test } from 'tap';
import {
  adjustAMI,
  computeAMIAndEVCreditEligibility,
} from '../../src/lib/ami-evcredit-calculation';
import { GeographyType, ResolvedLocation } from '../../src/lib/location';

const db = new Database('./incentives-api.db');

test('AMI adjustment', async t => {
  t.equal(adjustAMI(60400, 1), 42300);
  t.equal(adjustAMI(60400, 3), 54350);
  t.equal(adjustAMI(60400, 5), 65250);
  t.equal(adjustAMI(60400, 8), 79750);
});

const AS_LOCATION: ResolvedLocation = {
  zcta: '96799',
  state: 'AS',
  geographies: [],
  tract_geoid: '60010950600',
};
const GU_LOCATION: ResolvedLocation = {
  zcta: '96913',
  state: 'GU',
  geographies: [],
  tract_geoid: '66010951100',
};
const MP_LOCATION: ResolvedLocation = {
  zcta: '96950',
  state: 'MP',
  geographies: [],
  tract_geoid: '69110001700',
};
const VI_LOCATION: ResolvedLocation = {
  zcta: '00840',
  state: 'VI',
  geographies: [],
  tract_geoid: '78010971000',
};

test('territories other than PR', async t => {
  t.strictSame(await computeAMIAndEVCreditEligibility(db, AS_LOCATION, 4), {
    computedAMI80: 44100,
    computedAMI150: 97800,
    evCreditEligible: true,
  });
  t.strictSame(await computeAMIAndEVCreditEligibility(db, GU_LOCATION, 4), {
    computedAMI80: 71050,
    computedAMI150: 133200,
    evCreditEligible: true,
  });
  t.strictSame(await computeAMIAndEVCreditEligibility(db, MP_LOCATION, 4), {
    computedAMI80: 43350,
    computedAMI150: 97800,
    evCreditEligible: true,
  });
  t.strictSame(await computeAMIAndEVCreditEligibility(db, VI_LOCATION, 4), {
    computedAMI80: 59700,
    computedAMI150: 111900,
    evCreditEligible: true,
  });
});

const NY_TRACT = '36099950200';
const NY_LOCATION: ResolvedLocation = {
  state: 'NY',
  zcta: '13148',
  geographies: [
    {
      id: 32,
      type: GeographyType.State,
      name: 'New York',
      state: 'NY',
      county_fips: null,
      intersection_proportion: 1.0,
    },
    {
      id: 1927,
      type: GeographyType.County,
      name: 'Seneca County',
      state: 'NY',
      county_fips: '36099',
      intersection_proportion: 1.0,
    },
  ],
};

const DC_TRACT = '11001010700';
const DC_LOCATION: ResolvedLocation = {
  state: 'DC',
  zcta: '20036',
  geographies: [
    {
      id: 56,
      type: GeographyType.State,
      name: 'Washington DC',
      state: 'DC',
      county_fips: null,
      intersection_proportion: 1.0,
    },
    {
      id: 369,
      type: GeographyType.County,
      name: 'District of Columbia',
      state: 'DC',
      county_fips: '11001',
      intersection_proportion: 1.0,
    },
  ],
};

const PR_TRACT = '72127002100';
const PR_LOCATION: ResolvedLocation = {
  state: 'PR',
  zcta: '00907',
  geographies: [
    {
      id: 54,
      type: GeographyType.State,
      name: 'Puerto Rico',
      state: 'PR',
      county_fips: null,
      intersection_proportion: 1.0,
    },
    {
      id: 3266,
      type: GeographyType.County,
      name: 'San Juan Municipio',
      state: 'PR',
      county_fips: '72127',
      intersection_proportion: 1.0,
    },
  ],
};

test('states+DC+PR without tract', async t => {
  t.strictSame(await computeAMIAndEVCreditEligibility(db, NY_LOCATION, 4), {
    computedAMI80: 69350,
    computedAMI150: 130050,
    evCreditEligible: true,
  });
  t.strictSame(await computeAMIAndEVCreditEligibility(db, DC_LOCATION, 4), {
    computedAMI80: 97800,
    computedAMI150: 232050,
    evCreditEligible: false,
  });
  t.strictSame(await computeAMIAndEVCreditEligibility(db, PR_LOCATION, 4), {
    computedAMI80: 29500,
    computedAMI150: 97800,
    evCreditEligible: false,
  });
});

test('states+DC+PR with tract', async t => {
  t.strictSame(
    await computeAMIAndEVCreditEligibility(
      db,
      { ...NY_LOCATION, tract_geoid: NY_TRACT },
      4,
    ),
    {
      computedAMI80: 69350,
      computedAMI150: 130050,
      evCreditEligible: true,
    },
  );
  t.strictSame(
    await computeAMIAndEVCreditEligibility(
      db,
      { ...DC_LOCATION, tract_geoid: DC_TRACT },
      4,
    ),
    {
      computedAMI80: 97800,
      computedAMI150: 232050,
      evCreditEligible: true,
    },
  );
  t.strictSame(
    await computeAMIAndEVCreditEligibility(
      db,
      { ...PR_LOCATION, tract_geoid: PR_TRACT },
      4,
    ),
    {
      computedAMI80: 29500,
      computedAMI150: 97800,
      evCreditEligible: true,
    },
  );
});

test('EV charger eligibility', async t => {
  // The ZCTA 11211 contains both eligible and non-eligible tracts, so it
  // should be returned as not eligible.
  const brooklyn = {
    zcta: '11211',
    state: 'NY',
    geographies: [
      {
        id: 32,
        type: GeographyType.State,
        name: 'New York',
        state: 'NY',
        county_fips: null,
        intersection_proportion: 1.0,
      },
      {
        id: 1901,
        type: GeographyType.County,
        name: 'Kings County',
        state: 'NY',
        county_fips: '36047',
        intersection_proportion: 1.0,
      },
    ],
    customGeographiesComprehensive: false,
  };
  t.notOk(
    (await computeAMIAndEVCreditEligibility(db, brooklyn, 4))!.evCreditEligible,
  );

  // This is an ineligible tract within 11211 (not low income)
  t.notOk(
    (await computeAMIAndEVCreditEligibility(
      db,
      {
        ...brooklyn,
        tract_geoid: '36047051700',
      },
      4,
    ))!.evCreditEligible,
  );
  // This tract within 11211 is low income, so eligible
  t.ok(
    (await computeAMIAndEVCreditEligibility(
      db,
      {
        ...brooklyn,
        tract_geoid: '36047055300',
      },
      4,
    ))!.evCreditEligible,
  );
});
