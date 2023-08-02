import { test, beforeEach, afterEach } from 'tap';
import calculateIncentives from '../../src/lib/incentives-calculation.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import _ from 'lodash';
import fs from 'fs';

const AMIS_FOR_11211 = JSON.parse(
  fs.readFileSync('./test/fixtures/amis-for-zip-11211.json', 'utf-8'),
);
const AMIS_FOR_94117 = JSON.parse(
  fs.readFileSync('./test/fixtures/amis-for-zip-94117.json', 'utf-8'),
);
const AMIS_FOR_39503 = JSON.parse(
  fs.readFileSync('./test/fixtures/amis-for-zip-39503.json', 'utf-8'),
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

test('correctly evaluates scenerio "Single w/ $120k Household income"', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    location: { zip: '11211' },
    owner_status: 'homeowner',
    household_income: 120000,
    tax_filing: 'single',
    household_size: 1,
  });
  t.ok(data);
});

test('correctly evaluates scenerio "Joint w/ 5 persons and $60k Household income"', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    location: { zip: '11211' },
    owner_status: 'homeowner',
    household_income: 60000,
    tax_filing: 'joint',
    household_size: 5,
  });
  t.ok(data);
});

test('correctly evaluates scenerio "Joint w/ $300k Household income"', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    location: { zip: '11211' },
    owner_status: 'homeowner',
    household_income: 300000,
    tax_filing: 'joint',
    household_size: 4,
  });
  t.ok(data);
});

test('correctly evaluates scenerio "Single w/ $120k Household income in the Bronx"', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    location: { zip: '11211' },
    owner_status: 'homeowner',
    household_income: 120000,
    tax_filing: 'single',
    household_size: 1,
  });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, true);
  t.equal(data.is_over_150_ami, false);

  t.equal(data.pos_savings, 14000);
  t.equal(data.tax_savings, 18876);
  t.equal(data.performance_rebate_savings, 4000);

  t.equal(data.pos_rebate_incentives.length, 8);
  t.equal(data.tax_credit_incentives.length, 10);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(
    data.pos_rebate_incentives,
    i => i.item + i.item_type,
  );
  t.equal(
    Object.values(rebateCounts).every(c => c === 1),
    true,
  );
  const taxCreditCounts = _.countBy(
    data.tax_credit_incentives,
    i => i.item + i.item_type,
  );
  t.equal(
    Object.values(taxCreditCounts).every(c => c === 1),
    true,
  );

  const posRebates = _.keyBy(data.pos_rebate_incentives, 'item');
  t.equal(posRebates['electricPanel'].eligible, true);
  t.equal(posRebates['electricPanel'].amount.number, 4000);
  t.equal(posRebates['electricPanel'].start_date, 2023);
  t.equal(posRebates['electricStove'].eligible, true);
  t.equal(posRebates['electricStove'].amount.number, 840);
  t.equal(posRebates['electricStove'].start_date, 2023);
  t.equal(posRebates['electricWiring'].eligible, true);
  t.equal(posRebates['electricWiring'].amount.number, 2500);
  t.equal(posRebates['electricWiring'].start_date, 2023);
  t.equal(posRebates['heatPumpWaterHeater'].eligible, true);
  t.equal(posRebates['heatPumpWaterHeater'].amount.number, 1750);
  t.equal(posRebates['heatPumpWaterHeater'].start_date, 2023);
  t.equal(posRebates['heatPumpAirConditionerHeater'].eligible, true);
  t.equal(posRebates['heatPumpAirConditionerHeater'].amount.number, 8000);
  t.equal(posRebates['heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(posRebates['heatPumpClothesDryer'].eligible, true);
  t.equal(posRebates['heatPumpClothesDryer'].amount.number, 840);
  t.equal(posRebates['heatPumpClothesDryer'].start_date, 2023);
  t.equal(posRebates['weatherization'].eligible, true);
  t.equal(posRebates['weatherization'].amount.number, 1600);
  t.equal(posRebates['weatherization'].start_date, 2023);
  t.equal(posRebates['efficiencyRebates'].eligible, true);
  t.equal(posRebates['efficiencyRebates'].amount.number, 4000);
  t.equal(posRebates['efficiencyRebates'].start_date, 2023);

  const taxCredits = _.keyBy(data.tax_credit_incentives, 'item');
  t.equal(taxCredits['batteryStorageInstallation'].eligible, true);
  t.equal(taxCredits['batteryStorageInstallation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['batteryStorageInstallation'].start_date, 2023);
  t.equal(taxCredits['geothermalHeatingInstallation'].eligible, true);
  t.equal(taxCredits['geothermalHeatingInstallation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['geothermalHeatingInstallation'].start_date, 2022);
  t.equal(taxCredits['electricPanel'].eligible, true);
  t.equal(taxCredits['electricPanel'].amount.number, 600);
  t.equal(taxCredits['electricPanel'].start_date, 2023);
  t.equal(taxCredits['electricVehicleCharger'].eligible, true);
  t.equal(taxCredits['electricVehicleCharger'].amount.number, 1000);
  t.equal(taxCredits['electricVehicleCharger'].start_date, 2023);
  t.equal(taxCredits['newElectricVehicle'].eligible, true);
  t.equal(taxCredits['newElectricVehicle'].amount.number, 7500);
  t.equal(taxCredits['newElectricVehicle'].start_date, 2023);
  t.equal(taxCredits['heatPumpAirConditionerHeater'].eligible, true);
  t.equal(taxCredits['heatPumpAirConditionerHeater'].amount.number, 2000);
  t.equal(taxCredits['heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(taxCredits['heatPumpWaterHeater'].eligible, true);
  t.equal(taxCredits['heatPumpWaterHeater'].amount.number, 2000);
  t.equal(taxCredits['heatPumpWaterHeater'].start_date, 2023);
  t.equal(taxCredits['rooftopSolarInstallation'].eligible, true);
  t.equal(taxCredits['rooftopSolarInstallation'].amount.number, 0.3);
  t.equal(taxCredits['rooftopSolarInstallation'].amount.representative, 4770);
  t.equal(taxCredits['rooftopSolarInstallation'].start_date, 2022);
  t.equal(taxCredits['weatherization'].eligible, true);
  t.equal(taxCredits['weatherization'].amount.number, 1200);
  t.equal(taxCredits['weatherization'].start_date, 2023);
  // everything except used EV should be eligible for tax credit (agi limit is 75k)
  t.equal(taxCredits['usedElectricVehicle'].eligible, false);
  t.equal(taxCredits['usedElectricVehicle'].amount.number, 4000);
  t.equal(taxCredits['usedElectricVehicle'].start_date, 2023);
});

test('correctly evaluates scenerio "Married filing jointly w/ 2 kids and $250k Household income in San Francisco"', async t => {
  const data = calculateIncentives(AMIS_FOR_94117, {
    location: { zip: '94117' },
    owner_status: 'homeowner',
    household_income: 250000,
    tax_filing: 'joint',
    household_size: 4,
  });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, true);
  t.equal(data.is_over_150_ami, false);

  t.equal(data.pos_savings, 14000);
  t.equal(data.tax_savings, 23672);
  t.equal(data.performance_rebate_savings, 4000);

  t.equal(data.pos_rebate_incentives.length, 8);
  t.equal(data.tax_credit_incentives.length, 10);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(
    data.pos_rebate_incentives,
    i => i.item + i.item_type,
  );
  t.equal(
    Object.values(rebateCounts).every(c => c === 1),
    true,
  );
  const taxCreditCounts = _.countBy(
    data.tax_credit_incentives,
    i => i.item + i.item_type,
  );
  t.equal(
    Object.values(taxCreditCounts).every(c => c === 1),
    true,
  );

  const posRebates = _.keyBy(data.pos_rebate_incentives, 'item');
  t.equal(posRebates['electricPanel'].eligible, true);
  t.equal(posRebates['electricPanel'].amount.number, 4000);
  t.equal(posRebates['electricPanel'].start_date, 2023);
  t.equal(posRebates['electricStove'].eligible, true);
  t.equal(posRebates['electricStove'].amount.number, 840);
  t.equal(posRebates['electricStove'].start_date, 2023);
  t.equal(posRebates['electricWiring'].eligible, true);
  t.equal(posRebates['electricWiring'].amount.number, 2500);
  t.equal(posRebates['electricWiring'].start_date, 2023);
  t.equal(posRebates['heatPumpWaterHeater'].eligible, true);
  t.equal(posRebates['heatPumpWaterHeater'].amount.number, 1750);
  t.equal(posRebates['heatPumpWaterHeater'].start_date, 2023);
  t.equal(posRebates['heatPumpAirConditionerHeater'].eligible, true);
  t.equal(posRebates['heatPumpAirConditionerHeater'].amount.number, 8000);
  t.equal(posRebates['heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(posRebates['heatPumpClothesDryer'].eligible, true);
  t.equal(posRebates['heatPumpClothesDryer'].amount.number, 840);
  t.equal(posRebates['heatPumpClothesDryer'].start_date, 2023);
  t.equal(posRebates['weatherization'].eligible, true);
  t.equal(posRebates['weatherization'].amount.number, 1600);
  t.equal(posRebates['weatherization'].start_date, 2023);
  t.equal(posRebates['efficiencyRebates'].eligible, true);
  t.equal(posRebates['efficiencyRebates'].amount.number, 4000);
  t.equal(posRebates['efficiencyRebates'].start_date, 2023);

  const taxCredits = _.keyBy(data.tax_credit_incentives, 'item');
  t.equal(taxCredits['batteryStorageInstallation'].eligible, true);
  t.equal(taxCredits['batteryStorageInstallation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['batteryStorageInstallation'].start_date, 2023);
  t.equal(taxCredits['geothermalHeatingInstallation'].eligible, true);
  t.equal(taxCredits['geothermalHeatingInstallation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['geothermalHeatingInstallation'].start_date, 2022);
  t.equal(taxCredits['electricPanel'].eligible, true);
  t.equal(taxCredits['electricPanel'].amount.number, 600);
  t.equal(taxCredits['electricPanel'].start_date, 2023);
  t.equal(taxCredits['electricVehicleCharger'].eligible, true);
  t.equal(taxCredits['electricVehicleCharger'].amount.number, 1000);
  t.equal(taxCredits['electricVehicleCharger'].start_date, 2023);
  t.equal(taxCredits['newElectricVehicle'].eligible, true);
  t.equal(taxCredits['newElectricVehicle'].amount.number, 7500);
  t.equal(taxCredits['newElectricVehicle'].start_date, 2023);
  t.equal(taxCredits['heatPumpAirConditionerHeater'].eligible, true);
  t.equal(taxCredits['heatPumpAirConditionerHeater'].amount.number, 2000);
  t.equal(taxCredits['heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(taxCredits['heatPumpWaterHeater'].eligible, true);
  t.equal(taxCredits['heatPumpWaterHeater'].amount.number, 2000);
  t.equal(taxCredits['heatPumpWaterHeater'].start_date, 2023);
  t.equal(taxCredits['rooftopSolarInstallation'].eligible, true);
  t.equal(taxCredits['rooftopSolarInstallation'].amount.number, 0.3);
  t.equal(taxCredits['rooftopSolarInstallation'].amount.representative, 4572);
  t.equal(taxCredits['rooftopSolarInstallation'].start_date, 2022);
  t.equal(taxCredits['weatherization'].eligible, true);
  t.equal(taxCredits['weatherization'].amount.number, 1200);
  t.equal(taxCredits['weatherization'].start_date, 2023);
  // everything except used EV should be eligible for tax credit (agi limit is 75k)
  t.equal(taxCredits['usedElectricVehicle'].eligible, false);
  t.equal(taxCredits['usedElectricVehicle'].amount.number, 4000);
  t.equal(taxCredits['usedElectricVehicle'].start_date, 2023);
});

test('correctly evaluates scenerio "Hoh w/ 6 kids and $500k Household income in Missisippi"', async t => {
  const data = calculateIncentives(AMIS_FOR_39503, {
    location: { zip: '39503' },
    owner_status: 'homeowner',
    household_income: 500000,
    tax_filing: 'hoh',
    household_size: 8,
  });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, false);
  t.equal(data.is_over_150_ami, true);

  t.equal(data.pos_savings, 0);
  t.equal(data.tax_savings, 16028.9);
  t.equal(data.performance_rebate_savings, 4000);

  t.equal(data.pos_rebate_incentives.length, 8);
  t.equal(data.tax_credit_incentives.length, 10);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(
    data.pos_rebate_incentives,
    i => i.item + i.item_type,
  );
  t.equal(
    Object.values(rebateCounts).every(c => c === 1),
    true,
  );
  const taxCreditCounts = _.countBy(
    data.tax_credit_incentives,
    i => i.item + i.item_type,
  );
  t.equal(
    Object.values(taxCreditCounts).every(c => c === 1),
    true,
  );

  const posRebates = _.keyBy(data.pos_rebate_incentives, 'item');
  t.equal(posRebates['electricPanel'].eligible, false);
  t.equal(posRebates['electricPanel'].amount.number, 4000);
  t.equal(posRebates['electricPanel'].start_date, 2023);
  t.equal(posRebates['electricStove'].eligible, false);
  t.equal(posRebates['electricStove'].amount.number, 840);
  t.equal(posRebates['electricStove'].start_date, 2023);
  t.equal(posRebates['electricWiring'].eligible, false);
  t.equal(posRebates['electricWiring'].amount.number, 2500);
  t.equal(posRebates['electricWiring'].start_date, 2023);
  t.equal(posRebates['heatPumpWaterHeater'].eligible, false);
  t.equal(posRebates['heatPumpWaterHeater'].amount.number, 1750);
  t.equal(posRebates['heatPumpWaterHeater'].start_date, 2023);
  t.equal(posRebates['heatPumpAirConditionerHeater'].eligible, false);
  t.equal(posRebates['heatPumpAirConditionerHeater'].amount.number, 8000);
  t.equal(posRebates['heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(posRebates['heatPumpClothesDryer'].eligible, false);
  t.equal(posRebates['heatPumpClothesDryer'].amount.number, 840);
  t.equal(posRebates['heatPumpClothesDryer'].start_date, 2023);
  t.equal(posRebates['weatherization'].eligible, false);
  t.equal(posRebates['weatherization'].amount.number, 1600);
  t.equal(posRebates['weatherization'].start_date, 2023);
  // only items.efficiencyrebates are eligible here:
  t.equal(posRebates['efficiencyRebates'].eligible, true);
  t.equal(posRebates['efficiencyRebates'].amount.number, 4000);
  t.equal(posRebates['efficiencyRebates'].start_date, 2023);

  const taxCredits = _.keyBy(data.tax_credit_incentives, 'item');
  t.equal(taxCredits['batteryStorageInstallation'].eligible, true);
  t.equal(taxCredits['batteryStorageInstallation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['batteryStorageInstallation'].start_date, 2023);
  t.equal(taxCredits['geothermalHeatingInstallation'].eligible, true);
  t.equal(taxCredits['geothermalHeatingInstallation'].amount.number, 0.3); // will be displayed as 30%
  t.equal(taxCredits['geothermalHeatingInstallation'].start_date, 2022);
  t.equal(taxCredits['electricPanel'].eligible, true);
  t.equal(taxCredits['electricPanel'].amount.number, 600);
  t.equal(taxCredits['electricPanel'].start_date, 2023);
  t.equal(taxCredits['electricVehicleCharger'].eligible, true);
  t.equal(taxCredits['electricVehicleCharger'].amount.number, 1000);
  t.equal(taxCredits['electricVehicleCharger'].start_date, 2023);
  t.equal(taxCredits['heatPumpAirConditionerHeater'].eligible, true);
  t.equal(taxCredits['heatPumpAirConditionerHeater'].amount.number, 2000);
  t.equal(taxCredits['heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(taxCredits['heatPumpWaterHeater'].eligible, true);
  t.equal(taxCredits['heatPumpWaterHeater'].amount.number, 2000);
  t.equal(taxCredits['heatPumpWaterHeater'].start_date, 2023);
  t.equal(taxCredits['rooftopSolarInstallation'].eligible, true);
  t.equal(taxCredits['rooftopSolarInstallation'].amount.number, 0.3);
  t.equal(taxCredits['rooftopSolarInstallation'].amount.representative, 4428.9);
  t.equal(taxCredits['rooftopSolarInstallation'].start_date, 2022);
  t.equal(taxCredits['weatherization'].eligible, true);
  t.equal(taxCredits['weatherization'].amount.number, 1200);
  t.equal(taxCredits['weatherization'].start_date, 2023);
  // new and used EVs should not be eligible:
  t.equal(taxCredits['newElectricVehicle'].eligible, false);
  t.equal(taxCredits['newElectricVehicle'].amount.number, 7500);
  t.equal(taxCredits['newElectricVehicle'].start_date, 2023);
  t.equal(taxCredits['usedElectricVehicle'].eligible, false);
  t.equal(taxCredits['usedElectricVehicle'].amount.number, 4000);
  t.equal(taxCredits['usedElectricVehicle'].start_date, 2023);
});

test('correctly sorts incentives"', async t => {
  const data = calculateIncentives(AMIS_FOR_11211, {
    location: { zip: '11211' },
    owner_status: 'homeowner',
    household_income: 120000,
    tax_filing: 'single',
    household_size: 1,
  });
  for (const incentives of [
    data.pos_rebate_incentives,
    data.tax_credit_incentives,
  ]) {
    let prevIncentive = incentives[0];
    incentives.slice(1).forEach(incentive => {
      if (prevIncentive.amount.type === incentive.amount.type) {
        t.ok(prevIncentive.amount >= incentive.amount);
      } else {
        t.equal(prevIncentive.amount.type, 'percent');
        t.equal(incentive.amount.type, 'dollar_amount');
      }
      prevIncentive = incentive;
    });
  }
});
