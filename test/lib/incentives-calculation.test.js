import { test, beforeEach } from 'tap';
import fetchAMIsForZip from '../../lib/fetch-amis-for-zip.js';
import calculateIncentives from '../../lib/incentives-calculation.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import _ from 'lodash';

beforeEach(async (t) => {
  t.context.db = await open({
    filename: './incentives-api.db',
    driver: sqlite3.Database
  })
});

test('correctly evaluates scenerio "Single w/ $120k Household income"', async (t) => {
  const amisForZip = await fetchAMIsForZip(t.context.db, '11211');
  const data = calculateIncentives(amisForZip, {
    zip: '11211',
    owner_status: 'homeowner',
    household_income: 120000,
    tax_filing: 'single',
    household_size: 1
  });
  t.ok(data);
});

test('correctly evaluates scenerio "Joint w/ 5 persons and $60k Household income"', async (t) => {
  const amisForZip = await fetchAMIsForZip(t.context.db, '11211');
  const data = calculateIncentives(amisForZip, {
    zip: '11211',
    owner_status: 'homeowner',
    household_income: 60000,
    tax_filing: 'joint',
    household_size: 5
  });
  t.ok(data);
});

test('correctly evaluates scenerio "Joint w/ $300k Household income"', async (t) => {
  const amisForZip = await fetchAMIsForZip(t.context.db, '11211');
  const data = calculateIncentives(amisForZip, {
    zip: '11211',
    owner_status: 'homeowner',
    household_income: 300000,
    tax_filing: 'joint',
    household_size: 4
  });
  t.ok(data);
});

test('correctly evaluates scenerio "Single w/ $120k Household income in the Bronx"', async (t) => {
  const amisForZip = await fetchAMIsForZip(t.context.db, '11211');

  const data = calculateIncentives(amisForZip, { owner_status: 'homeowner', household_income: 120000, tax_filing: 'single', household_size: 1 });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, true);
  t.equal(data.is_over_150_ami, false);

  t.equal(data.pos_savings, 14000);
  t.equal(data.tax_savings, 18876);
  t.equal(data.performance_rebate_savings, 4000);

  t.equal(data.pos_rebate_incentives.length, 8);
  t.equal(data.tax_credit_incentives.length, 10);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(rebateCounts).every(c => c === 1), true);
  const taxCreditCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(taxCreditCounts).every(c => c === 1), true);

  const posRebates = _.keyBy(data.pos_rebate_incentives, 'item');
  t.equal(posRebates['items.electricPanel'].eligible, true);
  t.equal(posRebates['items.electricPanel'].amount, 4000);
  t.equal(posRebates['items.electricPanel'].start_date, 2023);
  t.equal(posRebates['items.electricStove'].eligible, true);
  t.equal(posRebates['items.electricStove'].amount, 840);
  t.equal(posRebates['items.electricStove'].start_date, 2023);
  t.equal(posRebates['items.electricWiring'].eligible, true);
  t.equal(posRebates['items.electricWiring'].amount, 2500);
  t.equal(posRebates['items.electricWiring'].start_date, 2023);
  t.equal(posRebates['items.heatPumpWaterHeater'].eligible, true);
  t.equal(posRebates['items.heatPumpWaterHeater'].amount, 1750);
  t.equal(posRebates['items.heatPumpWaterHeater'].start_date, 2023);
  t.equal(posRebates['items.heatPumpAirConditionerHeater'].eligible, true);
  t.equal(posRebates['items.heatPumpAirConditionerHeater'].amount, 8000);
  t.equal(posRebates['items.heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(posRebates['items.heatPumpClothesDryer'].eligible, true);
  t.equal(posRebates['items.heatPumpClothesDryer'].amount, 840);
  t.equal(posRebates['items.heatPumpClothesDryer'].start_date, 2023);
  t.equal(posRebates['items.weatherization'].eligible, true);
  t.equal(posRebates['items.weatherization'].amount, 1600);
  t.equal(posRebates['items.weatherization'].start_date, 2023);
  t.equal(posRebates['items.efficiencyRebates'].eligible, true);
  t.equal(posRebates['items.efficiencyRebates'].amount, 4000);
  t.equal(posRebates['items.efficiencyRebates'].start_date, 2023);

  const taxCredits = _.keyBy(data.tax_credit_incentives, 'item');
  t.equal(taxCredits['items.batteryStorageInstallation'].eligible, true);
  t.equal(taxCredits['items.batteryStorageInstallation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['items.batteryStorageInstallation'].start_date, 2023);
  t.equal(taxCredits['items.geothermalHeatingInstallation'].eligible, true);
  t.equal(taxCredits['items.geothermalHeatingInstallation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['items.geothermalHeatingInstallation'].start_date, 2022);
  t.equal(taxCredits['items.electricPanel'].eligible, true);
  t.equal(taxCredits['items.electricPanel'].amount, 600);
  t.equal(taxCredits['items.electricPanel'].start_date, 2023);
  t.equal(taxCredits['items.electricVehicleCharger'].eligible, true);
  t.equal(taxCredits['items.electricVehicleCharger'].amount, 1000);
  t.equal(taxCredits['items.electricVehicleCharger'].start_date, 2023);
  t.equal(taxCredits['items.newElectricVehicle'].eligible, true);
  t.equal(taxCredits['items.newElectricVehicle'].amount, 7500);
  t.equal(taxCredits['items.newElectricVehicle'].start_date, 2023);
  t.equal(taxCredits['items.heatPumpAirConditionerHeater'].eligible, true);
  t.equal(taxCredits['items.heatPumpAirConditionerHeater'].amount, 2000);
  t.equal(taxCredits['items.heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(taxCredits['items.heatPumpWaterHeater'].eligible, true);
  t.equal(taxCredits['items.heatPumpWaterHeater'].amount, 2000);
  t.equal(taxCredits['items.heatPumpWaterHeater'].start_date, 2023);
  t.equal(taxCredits['items.rooftopSolarInstallation'].eligible, true);
  t.equal(taxCredits['items.rooftopSolarInstallation'].amount, 0.3);
  t.equal(taxCredits['items.rooftopSolarInstallation'].representative_amount, 4770);
  t.equal(taxCredits['items.rooftopSolarInstallation'].start_date, 2022);
  t.equal(taxCredits['items.weatherization'].eligible, true);
  t.equal(taxCredits['items.weatherization'].amount, 1200);
  t.equal(taxCredits['items.weatherization'].start_date, 2023);
  // everything except used EV should be eligible for tax credit (agi limit is 75k)
  t.equal(taxCredits['items.usedElectricVehicle'].eligible, false);
  t.equal(taxCredits['items.usedElectricVehicle'].amount, 4000);
  t.equal(taxCredits['items.usedElectricVehicle'].start_date, 2023);
});

test('correctly evaluates scenerio "Married filing jointly w/ 2 kids and $250k Household income in San Francisco"', async (t) => {
  const amisForZip = await fetchAMIsForZip(t.context.db, '94117');

  const data = calculateIncentives(amisForZip, { owner_status: 'homeowner', household_income: 250000, tax_filing: 'joint', household_size: 4 });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, true);
  t.equal(data.is_over_150_ami, false);

  t.equal(data.pos_savings, 14000);
  t.equal(data.tax_savings, 23672);
  t.equal(data.performance_rebate_savings, 4000);

  t.equal(data.pos_rebate_incentives.length, 8);
  t.equal(data.tax_credit_incentives.length, 10);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(rebateCounts).every(c => c === 1), true);
  const taxCreditCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(taxCreditCounts).every(c => c === 1), true);

  const posRebates = _.keyBy(data.pos_rebate_incentives, 'item');
  t.equal(posRebates['items.electricPanel'].eligible, true);
  t.equal(posRebates['items.electricPanel'].amount, 4000);
  t.equal(posRebates['items.electricPanel'].start_date, 2023);
  t.equal(posRebates['items.electricStove'].eligible, true);
  t.equal(posRebates['items.electricStove'].amount, 840);
  t.equal(posRebates['items.electricStove'].start_date, 2023);
  t.equal(posRebates['items.electricWiring'].eligible, true);
  t.equal(posRebates['items.electricWiring'].amount, 2500);
  t.equal(posRebates['items.electricWiring'].start_date, 2023);
  t.equal(posRebates['items.heatPumpWaterHeater'].eligible, true);
  t.equal(posRebates['items.heatPumpWaterHeater'].amount, 1750);
  t.equal(posRebates['items.heatPumpWaterHeater'].start_date, 2023);
  t.equal(posRebates['items.heatPumpAirConditionerHeater'].eligible, true);
  t.equal(posRebates['items.heatPumpAirConditionerHeater'].amount, 8000);
  t.equal(posRebates['items.heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(posRebates['items.heatPumpClothesDryer'].eligible, true);
  t.equal(posRebates['items.heatPumpClothesDryer'].amount, 840);
  t.equal(posRebates['items.heatPumpClothesDryer'].start_date, 2023);
  t.equal(posRebates['items.weatherization'].eligible, true);
  t.equal(posRebates['items.weatherization'].amount, 1600);
  t.equal(posRebates['items.weatherization'].start_date, 2023);
  t.equal(posRebates['items.efficiencyRebates'].eligible, true);
  t.equal(posRebates['items.efficiencyRebates'].amount, 4000);
  t.equal(posRebates['items.efficiencyRebates'].start_date, 2023);

  const taxCredits = _.keyBy(data.tax_credit_incentives, 'item');
  t.equal(taxCredits['items.batteryStorageInstallation'].eligible, true);
  t.equal(taxCredits['items.batteryStorageInstallation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['items.batteryStorageInstallation'].start_date, 2023);
  t.equal(taxCredits['items.geothermalHeatingInstallation'].eligible, true);
  t.equal(taxCredits['items.geothermalHeatingInstallation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['items.geothermalHeatingInstallation'].start_date, 2022);
  t.equal(taxCredits['items.electricPanel'].eligible, true);
  t.equal(taxCredits['items.electricPanel'].amount, 600);
  t.equal(taxCredits['items.electricPanel'].start_date, 2023);
  t.equal(taxCredits['items.electricVehicleCharger'].eligible, true);
  t.equal(taxCredits['items.electricVehicleCharger'].amount, 1000);
  t.equal(taxCredits['items.electricVehicleCharger'].start_date, 2023);
  t.equal(taxCredits['items.newElectricVehicle'].eligible, true);
  t.equal(taxCredits['items.newElectricVehicle'].amount, 7500);
  t.equal(taxCredits['items.newElectricVehicle'].start_date, 2023);
  t.equal(taxCredits['items.heatPumpAirConditionerHeater'].eligible, true);
  t.equal(taxCredits['items.heatPumpAirConditionerHeater'].amount, 2000);
  t.equal(taxCredits['items.heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(taxCredits['items.heatPumpWaterHeater'].eligible, true);
  t.equal(taxCredits['items.heatPumpWaterHeater'].amount, 2000);
  t.equal(taxCredits['items.heatPumpWaterHeater'].start_date, 2023);
  t.equal(taxCredits['items.rooftopSolarInstallation'].eligible, true);
  t.equal(taxCredits['items.rooftopSolarInstallation'].amount, 0.3);
  t.equal(taxCredits['items.rooftopSolarInstallation'].representative_amount, 4572);
  t.equal(taxCredits['items.rooftopSolarInstallation'].start_date, 2022);
  t.equal(taxCredits['items.weatherization'].eligible, true);
  t.equal(taxCredits['items.weatherization'].amount, 1200);
  t.equal(taxCredits['items.weatherization'].start_date, 2023);
  // everything except used EV should be eligible for tax credit (agi limit is 75k)
  t.equal(taxCredits['items.usedElectricVehicle'].eligible, false);
  t.equal(taxCredits['items.usedElectricVehicle'].amount, 4000);
  t.equal(taxCredits['items.usedElectricVehicle'].start_date, 2023);
});

test('correctly evaluates scenerio "Hoh w/ 6 kids and $500k Household income in Missisippi"', async (t) => {
  const amisForZip = await fetchAMIsForZip(t.context.db, '39503');

  const data = calculateIncentives(amisForZip, { owner_status: 'homeowner', household_income: 500000, tax_filing: 'hoh', household_size: 8 });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, false);
  t.equal(data.is_over_150_ami, true);

  t.equal(data.pos_savings, 0);
  t.equal(data.tax_savings, 16028.9);
  t.equal(data.performance_rebate_savings, 4000);

  t.equal(data.pos_rebate_incentives.length, 8);
  t.equal(data.tax_credit_incentives.length, 10);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(rebateCounts).every(c => c === 1), true);
  const taxCreditCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(taxCreditCounts).every(c => c === 1), true);

  const posRebates = _.keyBy(data.pos_rebate_incentives, 'item');
  t.equal(posRebates['items.electricPanel'].eligible, false);
  t.equal(posRebates['items.electricPanel'].amount, 4000);
  t.equal(posRebates['items.electricPanel'].start_date, 2023);
  t.equal(posRebates['items.electricStove'].eligible, false);
  t.equal(posRebates['items.electricStove'].amount, 840);
  t.equal(posRebates['items.electricStove'].start_date, 2023);
  t.equal(posRebates['items.electricWiring'].eligible, false);
  t.equal(posRebates['items.electricWiring'].amount, 2500);
  t.equal(posRebates['items.electricWiring'].start_date, 2023);
  t.equal(posRebates['items.heatPumpWaterHeater'].eligible, false);
  t.equal(posRebates['items.heatPumpWaterHeater'].amount, 1750);
  t.equal(posRebates['items.heatPumpWaterHeater'].start_date, 2023);
  t.equal(posRebates['items.heatPumpAirConditionerHeater'].eligible, false);
  t.equal(posRebates['items.heatPumpAirConditionerHeater'].amount, 8000);
  t.equal(posRebates['items.heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(posRebates['items.heatPumpClothesDryer'].eligible, false);
  t.equal(posRebates['items.heatPumpClothesDryer'].amount, 840);
  t.equal(posRebates['items.heatPumpClothesDryer'].start_date, 2023);
  t.equal(posRebates['items.weatherization'].eligible, false);
  t.equal(posRebates['items.weatherization'].amount, 1600);
  t.equal(posRebates['items.weatherization'].start_date, 2023);
  // only items.efficiencyrebates are eligible here:
  t.equal(posRebates['items.efficiencyRebates'].eligible, true);
  t.equal(posRebates['items.efficiencyRebates'].amount, 4000);
  t.equal(posRebates['items.efficiencyRebates'].start_date, 2023);

  const taxCredits = _.keyBy(data.tax_credit_incentives, 'item');
  t.equal(taxCredits['items.batteryStorageInstallation'].eligible, true);
  t.equal(taxCredits['items.batteryStorageInstallation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['items.batteryStorageInstallation'].start_date, 2023);
  t.equal(taxCredits['items.geothermalHeatingInstallation'].eligible, true);
  t.equal(taxCredits['items.geothermalHeatingInstallation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['items.geothermalHeatingInstallation'].start_date, 2022);
  t.equal(taxCredits['items.electricPanel'].eligible, true);
  t.equal(taxCredits['items.electricPanel'].amount, 600);
  t.equal(taxCredits['items.electricPanel'].start_date, 2023);
  t.equal(taxCredits['items.electricVehicleCharger'].eligible, true);
  t.equal(taxCredits['items.electricVehicleCharger'].amount, 1000);
  t.equal(taxCredits['items.electricVehicleCharger'].start_date, 2023);
  t.equal(taxCredits['items.heatPumpAirConditionerHeater'].eligible, true);
  t.equal(taxCredits['items.heatPumpAirConditionerHeater'].amount, 2000);
  t.equal(taxCredits['items.heatPumpAirConditionerHeater'].start_date, 2023);
  t.equal(taxCredits['items.heatPumpWaterHeater'].eligible, true);
  t.equal(taxCredits['items.heatPumpWaterHeater'].amount, 2000);
  t.equal(taxCredits['items.heatPumpWaterHeater'].start_date, 2023);
  t.equal(taxCredits['items.rooftopSolarInstallation'].eligible, true);
  t.equal(taxCredits['items.rooftopSolarInstallation'].amount, 0.3);
  t.equal(taxCredits['items.rooftopSolarInstallation'].representative_amount, 4428.9);
  t.equal(taxCredits['items.rooftopSolarInstallation'].start_date, 2022);
  t.equal(taxCredits['items.weatherization'].eligible, true);
  t.equal(taxCredits['items.weatherization'].amount, 1200);
  t.equal(taxCredits['items.weatherization'].start_date, 2023);
  // everything except new and used EVs should be eligible:
  t.equal(taxCredits['items.newElectricVehicle'].eligible, false);
  t.equal(taxCredits['items.newElectricVehicle'].amount, 7500);
  t.equal(taxCredits['items.newElectricVehicle'].start_date, 2023);
  t.equal(taxCredits['items.usedElectricVehicle'].eligible, false);
  t.equal(taxCredits['items.usedElectricVehicle'].amount, 4000);
  t.equal(taxCredits['items.usedElectricVehicle'].start_date, 2023);
});
