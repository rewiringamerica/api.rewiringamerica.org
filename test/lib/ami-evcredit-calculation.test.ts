import { open } from 'sqlite';
import { Database } from 'sqlite3';
import { test } from 'tap';
import {
  adjustAMI,
  computeAMIAndEVCreditEligibility,
} from '../../src/lib/ami-evcredit-calculation';
import { ResolvedLocation } from '../../src/lib/location';

const DB_PROMISE = open({
  filename: './incentives-api.db',
  driver: Database,
});

test('AMI adjustment', async t => {
  t.equal(adjustAMI(60400, 1), 42300);
  t.equal(adjustAMI(60400, 3), 54350);
  t.equal(adjustAMI(60400, 5), 65250);
  t.equal(adjustAMI(60400, 8), 79750);
});

const AS_LOCATION: ResolvedLocation = {
  zcta: '96799',
  state: 'AS',
  city: 'Pago Pago',
  county_fips: '60010',
  tract_geoid: '60010950600',
};
const GU_LOCATION: ResolvedLocation = {
  zcta: '96913',
  state: 'GU',
  city: 'Barrigada',
  county_fips: '66010',
  tract_geoid: '66010951100',
};
const MP_LOCATION: ResolvedLocation = {
  zcta: '96950',
  state: 'MP',
  city: 'Saipan',
  county_fips: '69110',
  tract_geoid: '69110001700',
};
const VI_LOCATION: ResolvedLocation = {
  zcta: '00840',
  state: 'VI',
  city: 'Frederiksted',
  county_fips: '78010',
  tract_geoid: '78010971000',
};

test('territories other than PR', async t => {
  const db = await DB_PROMISE;
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
  city: 'Seneca Falls',
  county_fips: '36099',
  state: 'NY',
  zcta: '13148',
};

const DC_TRACT = '11001010700';
const DC_LOCATION: ResolvedLocation = {
  city: 'Washington',
  county_fips: '11001',
  state: 'DC',
  zcta: '20036',
};

const PR_TRACT = '72127002100';
const PR_LOCATION: ResolvedLocation = {
  city: 'San Juan',
  county_fips: '72127',
  state: 'PR',
  zcta: '00907',
};

test('states+DC+PR without tract', async t => {
  const db = await DB_PROMISE;

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
  const db = await DB_PROMISE;

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
  const db = await DB_PROMISE;

  // The ZCTA 11211 contains both eligible and non-eligible tracts, so it
  // should be returned as not eligible.
  const brooklyn = {
    zcta: '11211',
    state: 'NY',
    city: 'Brooklyn',
    county_fips: '36047',
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
