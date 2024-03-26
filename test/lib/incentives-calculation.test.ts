import fs from 'fs';
import _ from 'lodash';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { afterEach, beforeEach, test } from 'tap';
import { AuthoritiesByType, AuthorityType } from '../../src/data/authorities';
import { StateIncentive } from '../../src/data/state_incentives';
import { FilingStatus } from '../../src/data/tax_brackets';
import { AmountType } from '../../src/data/types/amount';
import { PaymentMethod } from '../../src/data/types/incentive-types';
import { OwnerStatus } from '../../src/data/types/owner-status';
import { BETA_STATES, LAUNCHED_STATES } from '../../src/data/types/states';
import calculateIncentives from '../../src/lib/incentives-calculation';
import { calculateStateIncentivesAndSavings } from '../../src/lib/state-incentives-calculation';

const AMIS_FOR_11211 = JSON.parse(
  fs.readFileSync('./test/fixtures/amis-for-zip-11211.json', 'utf-8'),
);
const AMIS_FOR_94117 = JSON.parse(
  fs.readFileSync('./test/fixtures/amis-for-zip-94117.json', 'utf-8'),
);
const AMIS_FOR_39503 = JSON.parse(
  fs.readFileSync('./test/fixtures/amis-for-zip-39503.json', 'utf-8'),
);
const AMIS_FOR_02861 = JSON.parse(
  fs.readFileSync('./test/fixtures/amis-for-zip-02861.json', 'utf-8'),
);
const AMIS_FOR_06002 = JSON.parse(
  fs.readFileSync('./test/fixtures/amis-for-zip-06002.json', 'utf-8'),
);

beforeEach(async t => {
  t.context.db = await open({
    filename: './incentives-api.db',
    driver: sqlite3.Database,
  });
});

afterEach(async t => {
  await t.context.db.close();
});

test('correctly evaluates scenario "Single w/ $120k Household income"', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 120000,
    tax_filing: FilingStatus.Single,
    household_size: 1,
  });
  t.ok(data);
});

test('beta states and launched states are disjoint', async t => {
  const data = LAUNCHED_STATES.filter(s => BETA_STATES.includes(s));
  t.equal(data.length, 0);
});

test('correctly evaluates state incentives for launched states', async t => {
  // RI is launched so should get state incentives even if include_beta_states = false.
  const data = calculateIncentives(AMIS_FOR_02861, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 120000,
    tax_filing: FilingStatus.Single,
    household_size: 1,
    authority_types: [AuthorityType.State],
    include_beta_states: false,
  });
  t.ok(data);
  t.not(data.incentives.length, 0);
});

test('correctly excludes state incentives for beta states', async t => {
  // CT is not launched so will not get state incentives.
  const data = calculateIncentives(AMIS_FOR_06002, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 120000,
    tax_filing: FilingStatus.Single,
    household_size: 1,
    authority_types: [AuthorityType.State, AuthorityType.Utility],
    utility: 'ct-norwich-public-utilities',
    include_beta_states: false,
  });
  t.ok(data);
  t.equal(data.incentives.length, 0);
});

test('correctly evaluates state incentives for beta states', async t => {
  // CT is in beta so we should get incentives for it when beta is requested.
  const data = calculateIncentives(AMIS_FOR_06002, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 120000,
    tax_filing: FilingStatus.Single,
    household_size: 1,
    authority_types: [AuthorityType.State, AuthorityType.Utility],
    utility: 'ct-norwich-public-utilities',
    include_beta_states: true,
  });
  t.ok(data);
  t.not(data.incentives.length, 0);
});

test('correctly evaluates scenario "Joint w/ 5 persons and $60k Household income"', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 60000,
    tax_filing: FilingStatus.Joint,
    household_size: 5,
  });
  t.ok(data);
});

test('correctly evaluates scenario "Joint w/ $300k Household income"', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 300000,
    tax_filing: FilingStatus.Joint,
    household_size: 4,
  });
  t.ok(data);
});

test('correctly evaluates scenario "MFS w/ $100k Household income"', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 100000,
    tax_filing: FilingStatus.MarriedFilingSeparately,
    household_size: 4,
  });
  t.ok(data);
});

test('correctly evaluates scenario "Single w/ $120k Household income in the Bronx"', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 120000,
    tax_filing: FilingStatus.Single,
    household_size: 1,
  });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, true);
  t.equal(data.is_over_150_ami, false);

  t.equal(data.savings.pos_rebate, 14000);
  t.equal(data.savings.tax_credit, 18876);
  t.equal(data.savings.performance_rebate, 4000);

  const pos_rebate_incentives = data.incentives.filter(
    i => i.payment_methods[0] === PaymentMethod.PosRebate,
  );
  const tax_credit_incentives = data.incentives.filter(
    i => i.payment_methods[0] === PaymentMethod.TaxCredit,
  );
  const performance_rebate_incentives = data.incentives.filter(
    i => i.payment_methods[0] === PaymentMethod.PerformanceRebate,
  );

  t.equal(pos_rebate_incentives.length, 7);
  t.equal(tax_credit_incentives.length, 10);
  t.equal(performance_rebate_incentives.length, 1);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(
    pos_rebate_incentives,
    i => i.item + i.payment_methods[0],
  );
  t.equal(
    Object.values(rebateCounts).every(c => c === 1),
    true,
  );
  const taxCreditCounts = _.countBy(
    tax_credit_incentives,
    i => i.item + i.payment_methods[0],
  );
  t.equal(
    Object.values(taxCreditCounts).every(c => c === 1),
    true,
  );

  const posRebates = _.keyBy(pos_rebate_incentives, 'item');
  t.equal(posRebates['electric_panel'].eligible, true);
  t.equal(posRebates['electric_panel'].amount.number, 4000);
  t.equal(posRebates['electric_panel'].start_date, '2025');
  t.equal(posRebates['electric_stove'].eligible, true);
  t.equal(posRebates['electric_stove'].amount.number, 840);
  t.equal(posRebates['electric_stove'].start_date, '2025');
  t.equal(posRebates['electric_wiring'].eligible, true);
  t.equal(posRebates['electric_wiring'].amount.number, 2500);
  t.equal(posRebates['electric_wiring'].start_date, '2025');
  t.equal(posRebates['heat_pump_water_heater'].eligible, true);
  t.equal(posRebates['heat_pump_water_heater'].amount.number, 1750);
  t.equal(posRebates['heat_pump_water_heater'].start_date, '2025');
  t.equal(posRebates['heat_pump_air_conditioner_heater'].eligible, true);
  t.equal(posRebates['heat_pump_air_conditioner_heater'].amount.number, 8000);
  t.equal(posRebates['heat_pump_air_conditioner_heater'].start_date, '2025');
  t.equal(posRebates['heat_pump_clothes_dryer'].eligible, true);
  t.equal(posRebates['heat_pump_clothes_dryer'].amount.number, 840);
  t.equal(posRebates['heat_pump_clothes_dryer'].start_date, '2025');
  t.equal(posRebates['weatherization'].eligible, true);
  t.equal(posRebates['weatherization'].amount.number, 1600);
  t.equal(posRebates['weatherization'].start_date, '2025');

  t.equal(performance_rebate_incentives[0].eligible, true);
  t.equal(performance_rebate_incentives[0].amount.number, 4000);
  t.equal(performance_rebate_incentives[0].start_date, '2025');

  const taxCredits = _.keyBy(tax_credit_incentives, 'item');
  t.equal(taxCredits['battery_storage_installation'].eligible, true);
  t.equal(taxCredits['battery_storage_installation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['battery_storage_installation'].start_date, '2023');
  t.equal(taxCredits['geothermal_heating_installation'].eligible, true);
  t.equal(taxCredits['geothermal_heating_installation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['geothermal_heating_installation'].start_date, '2022');
  t.equal(taxCredits['electric_panel'].eligible, true);
  t.equal(taxCredits['electric_panel'].amount.number, 600);
  t.equal(taxCredits['electric_panel'].start_date, '2023');
  t.equal(taxCredits['electric_vehicle_charger'].eligible, true);
  t.equal(taxCredits['electric_vehicle_charger'].amount.number, 1000);
  t.equal(taxCredits['electric_vehicle_charger'].start_date, '2023');
  t.equal(taxCredits['new_electric_vehicle'].eligible, true);
  t.equal(taxCredits['new_electric_vehicle'].amount.number, 7500);
  t.equal(taxCredits['new_electric_vehicle'].start_date, '2023');
  t.equal(taxCredits['heat_pump_air_conditioner_heater'].eligible, true);
  t.equal(taxCredits['heat_pump_air_conditioner_heater'].amount.number, 2000);
  t.equal(taxCredits['heat_pump_air_conditioner_heater'].start_date, '2023');
  t.equal(taxCredits['heat_pump_water_heater'].eligible, true);
  t.equal(taxCredits['heat_pump_water_heater'].amount.number, 2000);
  t.equal(taxCredits['heat_pump_water_heater'].start_date, '2023');
  t.equal(taxCredits['rooftop_solar_installation'].eligible, true);
  t.equal(taxCredits['rooftop_solar_installation'].amount.number, 0.3);
  t.equal(taxCredits['rooftop_solar_installation'].amount.representative, 4770);
  t.equal(taxCredits['rooftop_solar_installation'].start_date, '2022');
  t.equal(taxCredits['weatherization'].eligible, true);
  t.equal(taxCredits['weatherization'].amount.number, 1200);
  t.equal(taxCredits['weatherization'].start_date, '2023');
  // everything except used EV should be eligible for tax credit (agi limit is 75k)
  t.equal(taxCredits['used_electric_vehicle'].eligible, false);
  t.equal(taxCredits['used_electric_vehicle'].amount.number, 4000);
  t.equal(taxCredits['used_electric_vehicle'].start_date, '2023');
});

test('correctly evaluates scenario "Married filing jointly w/ 2 kids and $250k Household income in San Francisco"', async t => {
  const data = calculateIncentives(AMIS_FOR_94117, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 250000,
    tax_filing: FilingStatus.Joint,
    household_size: 4,
  });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, true);
  t.equal(data.is_over_150_ami, false);

  t.equal(data.savings.pos_rebate, 14000);
  t.equal(data.savings.tax_credit, 30872);
  t.equal(data.savings.performance_rebate, 4000);

  const pos_rebate_incentives = data.incentives.filter(
    i => i.payment_methods[0] === PaymentMethod.PosRebate,
  );
  const tax_credit_incentives = data.incentives.filter(
    i => i.payment_methods[0] === PaymentMethod.TaxCredit,
  );
  const performance_rebate_incentives = data.incentives.filter(
    i => i.payment_methods[0] === PaymentMethod.PerformanceRebate,
  );

  t.equal(pos_rebate_incentives.length, 7);
  t.equal(tax_credit_incentives.length, 10);
  t.equal(performance_rebate_incentives.length, 1);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(
    pos_rebate_incentives,
    i => i.item + i.payment_methods[0],
  );
  t.equal(
    Object.values(rebateCounts).every(c => c === 1),
    true,
  );
  const taxCreditCounts = _.countBy(
    tax_credit_incentives,
    i => i.item + i.payment_methods[0],
  );
  t.equal(
    Object.values(taxCreditCounts).every(c => c === 1),
    true,
  );

  const posRebates = _.keyBy(pos_rebate_incentives, 'item');
  t.equal(posRebates['electric_panel'].eligible, true);
  t.equal(posRebates['electric_panel'].amount.number, 4000);
  t.equal(posRebates['electric_panel'].start_date, '2025');
  t.equal(posRebates['electric_stove'].eligible, true);
  t.equal(posRebates['electric_stove'].amount.number, 840);
  t.equal(posRebates['electric_stove'].start_date, '2025');
  t.equal(posRebates['electric_wiring'].eligible, true);
  t.equal(posRebates['electric_wiring'].amount.number, 2500);
  t.equal(posRebates['electric_wiring'].start_date, '2025');
  t.equal(posRebates['heat_pump_water_heater'].eligible, true);
  t.equal(posRebates['heat_pump_water_heater'].amount.number, 1750);
  t.equal(posRebates['heat_pump_water_heater'].start_date, '2025');
  t.equal(posRebates['heat_pump_air_conditioner_heater'].eligible, true);
  t.equal(posRebates['heat_pump_air_conditioner_heater'].amount.number, 8000);
  t.equal(posRebates['heat_pump_air_conditioner_heater'].start_date, '2025');
  t.equal(posRebates['heat_pump_clothes_dryer'].eligible, true);
  t.equal(posRebates['heat_pump_clothes_dryer'].amount.number, 840);
  t.equal(posRebates['heat_pump_clothes_dryer'].start_date, '2025');
  t.equal(posRebates['weatherization'].eligible, true);
  t.equal(posRebates['weatherization'].amount.number, 1600);
  t.equal(posRebates['weatherization'].start_date, '2025');

  t.equal(performance_rebate_incentives[0].eligible, true);
  t.equal(performance_rebate_incentives[0].amount.number, 4000);
  t.equal(performance_rebate_incentives[0].start_date, '2025');

  const taxCredits = _.keyBy(tax_credit_incentives, 'item');
  t.equal(taxCredits['battery_storage_installation'].eligible, true);
  t.equal(taxCredits['battery_storage_installation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['battery_storage_installation'].start_date, '2023');
  t.equal(taxCredits['geothermal_heating_installation'].eligible, true);
  t.equal(taxCredits['geothermal_heating_installation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['geothermal_heating_installation'].start_date, '2022');
  t.equal(taxCredits['electric_panel'].eligible, true);
  t.equal(taxCredits['electric_panel'].amount.number, 600);
  t.equal(taxCredits['electric_panel'].start_date, '2023');
  t.equal(taxCredits['electric_vehicle_charger'].eligible, true);
  t.equal(taxCredits['electric_vehicle_charger'].amount.number, 1000);
  t.equal(taxCredits['electric_vehicle_charger'].start_date, '2023');
  t.equal(taxCredits['new_electric_vehicle'].eligible, true);
  t.equal(taxCredits['new_electric_vehicle'].amount.number, 7500);
  t.equal(taxCredits['new_electric_vehicle'].start_date, '2023');
  t.equal(taxCredits['heat_pump_air_conditioner_heater'].eligible, true);
  t.equal(taxCredits['heat_pump_air_conditioner_heater'].amount.number, 2000);
  t.equal(taxCredits['heat_pump_air_conditioner_heater'].start_date, '2023');
  t.equal(taxCredits['heat_pump_water_heater'].eligible, true);
  t.equal(taxCredits['heat_pump_water_heater'].amount.number, 2000);
  t.equal(taxCredits['heat_pump_water_heater'].start_date, '2023');
  t.equal(taxCredits['rooftop_solar_installation'].eligible, true);
  t.equal(taxCredits['rooftop_solar_installation'].amount.number, 0.3);
  t.equal(taxCredits['rooftop_solar_installation'].amount.representative, 4572);
  t.equal(taxCredits['rooftop_solar_installation'].start_date, '2022');
  t.equal(taxCredits['weatherization'].eligible, true);
  t.equal(taxCredits['weatherization'].amount.number, 1200);
  t.equal(taxCredits['weatherization'].start_date, '2023');
  // everything except used EV should be eligible for tax credit (agi limit is 75k)
  t.equal(taxCredits['used_electric_vehicle'].eligible, false);
  t.equal(taxCredits['used_electric_vehicle'].amount.number, 4000);
  t.equal(taxCredits['used_electric_vehicle'].start_date, '2023');
});

test('correctly evaluates scenario "Hoh w/ 6 kids and $500k Household income in Missisippi"', async t => {
  const data = calculateIncentives(AMIS_FOR_39503, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 500000,
    tax_filing: FilingStatus.HoH,
    household_size: 8,
  });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, false);
  t.equal(data.is_over_150_ami, true);

  t.equal(data.savings.pos_rebate, 0);
  t.equal(data.savings.tax_credit, 23228.9);
  t.equal(data.savings.performance_rebate, 4000);

  const pos_rebate_incentives = data.incentives.filter(
    i => i.payment_methods[0] === PaymentMethod.PosRebate,
  );
  const tax_credit_incentives = data.incentives.filter(
    i => i.payment_methods[0] === PaymentMethod.TaxCredit,
  );
  const performance_rebate_incentives = data.incentives.filter(
    i => i.payment_methods[0] === PaymentMethod.PerformanceRebate,
  );

  t.equal(pos_rebate_incentives.length, 7);
  t.equal(tax_credit_incentives.length, 10);
  t.equal(performance_rebate_incentives.length, 1);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(
    pos_rebate_incentives,
    i => i.item + i.payment_methods[0],
  );
  t.equal(
    Object.values(rebateCounts).every(c => c === 1),
    true,
  );
  const taxCreditCounts = _.countBy(
    tax_credit_incentives,
    i => i.item + i.payment_methods[0],
  );
  t.equal(
    Object.values(taxCreditCounts).every(c => c === 1),
    true,
  );

  const posRebates = _.keyBy(pos_rebate_incentives, 'item');
  t.equal(posRebates['electric_panel'].eligible, false);
  t.equal(posRebates['electric_panel'].amount.number, 4000);
  t.equal(posRebates['electric_panel'].start_date, '2025');
  t.equal(posRebates['electric_stove'].eligible, false);
  t.equal(posRebates['electric_stove'].amount.number, 840);
  t.equal(posRebates['electric_stove'].start_date, '2025');
  t.equal(posRebates['electric_wiring'].eligible, false);
  t.equal(posRebates['electric_wiring'].amount.number, 2500);
  t.equal(posRebates['electric_wiring'].start_date, '2025');
  t.equal(posRebates['heat_pump_water_heater'].eligible, false);
  t.equal(posRebates['heat_pump_water_heater'].amount.number, 1750);
  t.equal(posRebates['heat_pump_water_heater'].start_date, '2025');
  t.equal(posRebates['heat_pump_air_conditioner_heater'].eligible, false);
  t.equal(posRebates['heat_pump_air_conditioner_heater'].amount.number, 8000);
  t.equal(posRebates['heat_pump_air_conditioner_heater'].start_date, '2025');
  t.equal(posRebates['heat_pump_clothes_dryer'].eligible, false);
  t.equal(posRebates['heat_pump_clothes_dryer'].amount.number, 840);
  t.equal(posRebates['heat_pump_clothes_dryer'].start_date, '2025');
  t.equal(posRebates['weatherization'].eligible, false);
  t.equal(posRebates['weatherization'].amount.number, 1600);
  t.equal(posRebates['weatherization'].start_date, '2025');

  // only items.efficiency_rebates are eligible here:
  t.equal(performance_rebate_incentives[0].eligible, true);
  t.equal(performance_rebate_incentives[0].amount.number, 4000);
  t.equal(performance_rebate_incentives[0].start_date, '2025');

  const taxCredits = _.keyBy(tax_credit_incentives, 'item');
  t.equal(taxCredits['battery_storage_installation'].eligible, true);
  t.equal(taxCredits['battery_storage_installation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['battery_storage_installation'].start_date, '2023');
  t.equal(taxCredits['geothermal_heating_installation'].eligible, true);
  t.equal(taxCredits['geothermal_heating_installation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['geothermal_heating_installation'].start_date, '2022');
  t.equal(taxCredits['electric_panel'].eligible, true);
  t.equal(taxCredits['electric_panel'].amount.number, 600);
  t.equal(taxCredits['electric_panel'].start_date, '2023');
  t.equal(taxCredits['electric_vehicle_charger'].eligible, true);
  t.equal(taxCredits['electric_vehicle_charger'].amount.number, 1000);
  t.equal(taxCredits['electric_vehicle_charger'].start_date, '2023');
  t.equal(taxCredits['heat_pump_air_conditioner_heater'].eligible, true);
  t.equal(taxCredits['heat_pump_air_conditioner_heater'].amount.number, 2000);
  t.equal(taxCredits['heat_pump_air_conditioner_heater'].start_date, '2023');
  t.equal(taxCredits['heat_pump_water_heater'].eligible, true);
  t.equal(taxCredits['heat_pump_water_heater'].amount.number, 2000);
  t.equal(taxCredits['heat_pump_water_heater'].start_date, '2023');
  t.equal(taxCredits['rooftop_solar_installation'].eligible, true);
  t.equal(taxCredits['rooftop_solar_installation'].amount.number, 0.3);
  t.equal(
    taxCredits['rooftop_solar_installation'].amount.representative,
    4428.9,
  );
  t.equal(taxCredits['rooftop_solar_installation'].start_date, '2022');
  t.equal(taxCredits['weatherization'].eligible, true);
  t.equal(taxCredits['weatherization'].amount.number, 1200);
  t.equal(taxCredits['weatherization'].start_date, '2023');
  // new and used EVs should not be eligible:
  t.equal(taxCredits['new_electric_vehicle'].eligible, false);
  t.equal(taxCredits['new_electric_vehicle'].amount.number, 7500);
  t.equal(taxCredits['new_electric_vehicle'].start_date, '2023');
  t.equal(taxCredits['used_electric_vehicle'].eligible, false);
  t.equal(taxCredits['used_electric_vehicle'].amount.number, 4000);
  t.equal(taxCredits['used_electric_vehicle'].start_date, '2023');
});

test('correctly sorts incentives', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    owner_status: OwnerStatus.Homeowner,
    household_income: 120000,
    tax_filing: FilingStatus.Single,
    household_size: 1,
  });
  let prevIncentive = data.incentives[0];
  data.incentives.slice(1).forEach(incentive => {
    if (prevIncentive.payment_methods[0] === incentive.payment_methods[0]) {
      if (prevIncentive.amount.type === incentive.amount.type) {
        t.ok(prevIncentive.amount >= incentive.amount);
      } else {
        t.equal(prevIncentive.amount.type, 'percent');
        t.equal(incentive.amount.type, 'dollar_amount');
      }
    } else {
      // Tax credits must all be sorted at the end. Rebate types can be mixed.
      if (prevIncentive.payment_methods[0] === 'tax_credit') {
        t.equal(incentive.payment_methods[0], 'tax_credit');
      }
    }
    prevIncentive = incentive;
  });
});

test('correct filtering of county incentives', async t => {
  const incentive: StateIncentive = {
    id: 'CO',
    authority_type: AuthorityType.County,
    authority: 'mock-county-authority',
    start_date: '2023',
    end_date: '2024',
    payment_methods: [PaymentMethod.AccountCredit],
    item: 'heat_pump_air_conditioner_heater',
    program: 'ri_hvacAndWaterHeaterIncentives',
    amount: {
      type: AmountType.DollarAmount,
      number: 100,
    },
    owner_status: [
      OwnerStatus.Homeowner,
    ],
    short_description: {
      en: 'This is a model incentive only to be used for testing.',
    },
  };

  const authorities: AuthoritiesByType = {
    state: {},
    utility: {},
    county: {
      'mock-county-authority': {
        name: 'The Mock Authority Company',
        county: 'Cook',
      },
    },
  };

  const request = {
    owner_status: OwnerStatus.Homeowner,
    household_income: 120000,
    tax_filing: FilingStatus.Single,
    household_size: 1,
    authority_types: [AuthorityType.County],
    include_beta_states: true,
  };
  const shouldFind = calculateStateIncentivesAndSavings(
    { state_id: 'CO', county: 'Cook' },
    request,
    [incentive],
    {},
    authorities,
  );
  t.ok(shouldFind);
  t.equal(shouldFind.stateIncentives.length, 1);

  const shouldNotFind = calculateStateIncentivesAndSavings(
    { state_id: 'CO', county: 'Nomatch' },
    request,
    [incentive],
    {},
    authorities,
  );
  t.ok(shouldNotFind);
  t.equal(shouldNotFind.stateIncentives.length, 0);
});

test('correct filtering of city incentives', async t => {
  const incentive: StateIncentive = {
    id: 'CO',
    authority_type: AuthorityType.City,
    authority: 'mock-city-authority',
    start_date: '2023',
    end_date: '2024',
    payment_methods: [PaymentMethod.AccountCredit],
    item: 'heat_pump_air_conditioner_heater',
    program: 'ri_hvacAndWaterHeaterIncentives',
    amount: {
      type: AmountType.DollarAmount,
      number: 100,
    },
    owner_status: [
      OwnerStatus.Homeowner,
    ],
    short_description: {
      en: 'This is a model incentive only to be used for testing.',
    },
  };

  const authorities: AuthoritiesByType = {
    state: {},
    utility: {},
    city: {
      'mock-city-authority': {
        name: 'The Mock Authority Company',
        city: 'New York',
        county: 'Cook',
      },
    },
  };

  const request = {
    owner_status: OwnerStatus.Homeowner,
    household_income: 120000,
    tax_filing: FilingStatus.Single,
    household_size: 1,
    authority_types: [AuthorityType.City],
    include_beta_states: true,
  };
  const shouldFind = calculateStateIncentivesAndSavings(
    { state_id: 'CO', city: 'New York', county: 'Cook' },
    request,
    [incentive],
    {},
    authorities,
  );
  t.ok(shouldFind);
  t.equal(shouldFind.stateIncentives.length, 1);

  const shouldNotFindWithoutCounty = calculateStateIncentivesAndSavings(
    { state_id: 'CO', city: 'New York' },
    request,
    [incentive],
    {},
    authorities,
  );
  t.ok(shouldNotFindWithoutCounty);
  t.equal(shouldNotFindWithoutCounty.stateIncentives.length, 0);

  const shouldNotFindWithPartialMatch = calculateStateIncentivesAndSavings(
    { state_id: 'CO', city: 'New York', county: 'NoMatch' },
    request,
    [incentive],
    {},
    authorities,
  );
  t.ok(shouldNotFindWithPartialMatch);
  t.equal(shouldNotFindWithPartialMatch.stateIncentives.length, 0);
});

test('correctly evaluates savings when state tax liability is lower than max savings', async t => {
  const incentive: StateIncentive = {
    id: 'CO',
    authority_type: AuthorityType.State,
    authority: 'mock-state-authority',
    start_date: '2023',
    end_date: '2024',
    payment_methods: [PaymentMethod.TaxCredit],
    item: 'heat_pump_air_conditioner_heater',
    program: 'co_hvacAndWaterHeaterIncentives',
    amount: {
      type: AmountType.DollarAmount,
      number: 10000,
    },
    owner_status: [
      OwnerStatus.Homeowner,
    ],
    short_description: {
      en: 'This is a model incentive only to be used for testing.',
    },
  };

  const authorities: AuthoritiesByType = {
    state: {},
    utility: {},
    city: {
      'mock-state-authority': {
        name: 'Colorado Mock Department of Energy',
        city: 'Colorado Springs',
        county: 'El Paso County',
      },
    },
  };

  const request = {
    owner_status: OwnerStatus.Homeowner,
    household_income: 100000,
    tax_filing: FilingStatus.MarriedFilingSeparately,
    household_size: 8,
    authority_types: [AuthorityType.State],
    include_beta_states: true,
  };

  const result = calculateStateIncentivesAndSavings(
    { state_id: 'CO', city: 'Colorado Springs', county: 'El Paso County' },
    request,
    [incentive],
    {},
    authorities,
  );

  t.ok(result);
  t.equal(result.stateIncentives.length, 1);
  t.equal(result.stateIncentives[0].amount.number, 4400);
  t.equal(result.savings.tax_credit, 4400);
});
