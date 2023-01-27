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
  t.equal(data.estimated_annual_savings, 1130);

  t.equal(data.pos_rebate_incentives.length, 8);
  t.equal(data.tax_credit_incentives.length, 10);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(rebateCounts).every(c => c === 1), true);
  const taxCreditCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(taxCreditCounts).every(c => c === 1), true);

  const posRebates = _.keyBy(data.pos_rebate_incentives, 'item');
  t.equal(posRebates['Electric Panel'].eligible, true);
  t.equal(posRebates['Electric Panel'].amount, 4000);
  t.equal(posRebates['Electric Panel'].start_date, 2023);
  t.equal(posRebates['Electric Stove'].eligible, true);
  t.equal(posRebates['Electric Stove'].amount, 840);
  t.equal(posRebates['Electric Stove'].start_date, 2023);
  t.equal(posRebates['Electric Wiring'].eligible, true);
  t.equal(posRebates['Electric Wiring'].amount, 2500);
  t.equal(posRebates['Electric Wiring'].start_date, 2023);
  t.equal(posRebates['Heat Pump Water Heater'].eligible, true);
  t.equal(posRebates['Heat Pump Water Heater'].amount, 1750);
  t.equal(posRebates['Heat Pump Water Heater'].start_date, 2023);
  t.equal(posRebates['Heat Pump Air Conditioner/Heater'].eligible, true);
  t.equal(posRebates['Heat Pump Air Conditioner/Heater'].amount, 8000);
  t.equal(posRebates['Heat Pump Air Conditioner/Heater'].start_date, 2023);
  t.equal(posRebates['Heat Pump Clothes Dryer'].eligible, true);
  t.equal(posRebates['Heat Pump Clothes Dryer'].amount, 840);
  t.equal(posRebates['Heat Pump Clothes Dryer'].start_date, 2023);
  t.equal(posRebates['Weatherization'].eligible, true);
  t.equal(posRebates['Weatherization'].amount, 1600);
  t.equal(posRebates['Weatherization'].start_date, 2023);
  t.equal(posRebates['Efficiency Rebates'].eligible, true);
  t.equal(posRebates['Efficiency Rebates'].amount, 4000);
  t.equal(posRebates['Efficiency Rebates'].start_date, 2023);

  const taxCredits = _.keyBy(data.tax_credit_incentives, 'item');
  t.equal(taxCredits['Battery Storage Installation'].eligible, true);
  t.equal(taxCredits['Battery Storage Installation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['Battery Storage Installation'].start_date, 2023);
  t.equal(taxCredits['Geothermal Heating Installation'].eligible, true);
  t.equal(taxCredits['Geothermal Heating Installation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['Geothermal Heating Installation'].start_date, 2022);
  t.equal(taxCredits['Electric Panel'].eligible, true);
  t.equal(taxCredits['Electric Panel'].amount, 600);
  t.equal(taxCredits['Electric Panel'].start_date, 2023);
  t.equal(taxCredits['Electric Vehicle Charger'].eligible, true);
  t.equal(taxCredits['Electric Vehicle Charger'].amount, 1000);
  t.equal(taxCredits['Electric Vehicle Charger'].start_date, 2023);
  t.equal(taxCredits['New Electric Vehicle'].eligible, true);
  t.equal(taxCredits['New Electric Vehicle'].amount, 7500);
  t.equal(taxCredits['New Electric Vehicle'].start_date, 2023);
  t.equal(taxCredits['Heat Pump Air Conditioner/Heater'].eligible, true);
  t.equal(taxCredits['Heat Pump Air Conditioner/Heater'].amount, 2000);
  t.equal(taxCredits['Heat Pump Air Conditioner/Heater'].start_date, 2023);
  t.equal(taxCredits['Heat Pump Water Heater'].eligible, true);
  t.equal(taxCredits['Heat Pump Water Heater'].amount, 2000);
  t.equal(taxCredits['Heat Pump Water Heater'].start_date, 2023);
  t.equal(taxCredits['Rooftop Solar Installation'].eligible, true);
  // solar comes back as dollars even though it will be displayed as %
  t.equal(taxCredits['Rooftop Solar Installation'].amount, 4770);
  t.equal(taxCredits['Rooftop Solar Installation'].start_date, 2022);
  t.equal(taxCredits['Weatherization'].eligible, true);
  t.equal(taxCredits['Weatherization'].amount, 1200);
  t.equal(taxCredits['Weatherization'].start_date, 2023);
  // everything except used EV should be eligible for tax credit (agi limit is 75k)
  t.equal(taxCredits['Used Electric Vehicle'].eligible, false);
  t.equal(taxCredits['Used Electric Vehicle'].amount, 4000);
  t.equal(taxCredits['Used Electric Vehicle'].start_date, 2023);
});

test('correctly evaluates scenerio "Married filing jointly w/ 2 kids and $250k Household income in San Francisco"', async (t) => {
  const amisForZip = await fetchAMIsForZip(t.context.db, '94117');

  const data = calculateIncentives(amisForZip, { owner_status: 'homeowner', household_income: 250000, tax_filing: 'joint', household_size: 4 });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, true);
  t.equal(data.is_over_150_ami, false);

  t.equal(data.pos_savings, 14000);
  t.equal(data.tax_savings, 22672);
  t.equal(data.performance_rebate_savings, 4000);
  t.equal(data.estimated_annual_savings, 1340);

  t.equal(data.pos_rebate_incentives.length, 8);
  t.equal(data.tax_credit_incentives.length, 10);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(rebateCounts).every(c => c === 1), true);
  const taxCreditCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(taxCreditCounts).every(c => c === 1), true);

  const posRebates = _.keyBy(data.pos_rebate_incentives, 'item');
  t.equal(posRebates['Electric Panel'].eligible, true);
  t.equal(posRebates['Electric Panel'].amount, 4000);
  t.equal(posRebates['Electric Panel'].start_date, 2023);
  t.equal(posRebates['Electric Stove'].eligible, true);
  t.equal(posRebates['Electric Stove'].amount, 840);
  t.equal(posRebates['Electric Stove'].start_date, 2023);
  t.equal(posRebates['Electric Wiring'].eligible, true);
  t.equal(posRebates['Electric Wiring'].amount, 2500);
  t.equal(posRebates['Electric Wiring'].start_date, 2023);
  t.equal(posRebates['Heat Pump Water Heater'].eligible, true);
  t.equal(posRebates['Heat Pump Water Heater'].amount, 1750);
  t.equal(posRebates['Heat Pump Water Heater'].start_date, 2023);
  t.equal(posRebates['Heat Pump Air Conditioner/Heater'].eligible, true);
  t.equal(posRebates['Heat Pump Air Conditioner/Heater'].amount, 8000);
  t.equal(posRebates['Heat Pump Air Conditioner/Heater'].start_date, 2023);
  t.equal(posRebates['Heat Pump Clothes Dryer'].eligible, true);
  t.equal(posRebates['Heat Pump Clothes Dryer'].amount, 840);
  t.equal(posRebates['Heat Pump Clothes Dryer'].start_date, 2023);
  t.equal(posRebates['Weatherization'].eligible, true);
  t.equal(posRebates['Weatherization'].amount, 1600);
  t.equal(posRebates['Weatherization'].start_date, 2023);
  t.equal(posRebates['Efficiency Rebates'].eligible, true);
  t.equal(posRebates['Efficiency Rebates'].amount, 4000);
  t.equal(posRebates['Efficiency Rebates'].start_date, 2023);

  const taxCredits = _.keyBy(data.tax_credit_incentives, 'item');
  t.equal(taxCredits['Battery Storage Installation'].eligible, true);
  t.equal(taxCredits['Battery Storage Installation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['Battery Storage Installation'].start_date, 2023);
  t.equal(taxCredits['Geothermal Heating Installation'].eligible, true);
  t.equal(taxCredits['Geothermal Heating Installation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['Geothermal Heating Installation'].start_date, 2022);
  t.equal(taxCredits['Electric Panel'].eligible, true);
  t.equal(taxCredits['Electric Panel'].amount, 600);
  t.equal(taxCredits['Electric Panel'].start_date, 2023);
  t.equal(taxCredits['Electric Vehicle Charger'].eligible, true);
  t.equal(taxCredits['Electric Vehicle Charger'].amount, 1000);
  t.equal(taxCredits['Electric Vehicle Charger'].start_date, 2023);
  t.equal(taxCredits['New Electric Vehicle'].eligible, true);
  t.equal(taxCredits['New Electric Vehicle'].amount, 7500);
  t.equal(taxCredits['New Electric Vehicle'].start_date, 2023);
  t.equal(taxCredits['Heat Pump Air Conditioner/Heater'].eligible, true);
  t.equal(taxCredits['Heat Pump Air Conditioner/Heater'].amount, 2000);
  t.equal(taxCredits['Heat Pump Air Conditioner/Heater'].start_date, 2023);
  t.equal(taxCredits['Heat Pump Water Heater'].eligible, true);
  t.equal(taxCredits['Heat Pump Water Heater'].amount, 2000);
  t.equal(taxCredits['Heat Pump Water Heater'].start_date, 2023);
  t.equal(taxCredits['Rooftop Solar Installation'].eligible, true);
  // solar comes back as dollars even though it will be displayed as %
  t.equal(taxCredits['Rooftop Solar Installation'].amount, 4572);
  t.equal(taxCredits['Rooftop Solar Installation'].start_date, 2022);
  t.equal(taxCredits['Weatherization'].eligible, true);
  t.equal(taxCredits['Weatherization'].amount, 1200);
  t.equal(taxCredits['Weatherization'].start_date, 2023);
  // everything except used EV should be eligible for tax credit (agi limit is 75k)
  t.equal(taxCredits['Used Electric Vehicle'].eligible, false);
  t.equal(taxCredits['Used Electric Vehicle'].amount, 4000);
  t.equal(taxCredits['Used Electric Vehicle'].start_date, 2023);
});

test('correctly evaluates scenerio "Hoh w/ 6 kids and $500k Household income in Missisippi"', async (t) => {
  const amisForZip = await fetchAMIsForZip(t.context.db, '39503');

  const data = calculateIncentives(amisForZip, { owner_status: 'homeowner', household_income: 500000, tax_filing: 'hoh', household_size: 8 });

  t.equal(data.is_under_80_ami, false);
  t.equal(data.is_under_150_ami, false);
  t.equal(data.is_over_150_ami, true);

  t.equal(data.pos_savings, 0);
  t.equal(data.tax_savings, 15028.9);
  t.equal(data.performance_rebate_savings, 4000);
  t.equal(data.estimated_annual_savings, 1450);

  t.equal(data.pos_rebate_incentives.length, 8);
  t.equal(data.tax_credit_incentives.length, 10);

  // count the incentives by key used to de-dupe in UI:
  const rebateCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(rebateCounts).every(c => c === 1), true);
  const taxCreditCounts = _.countBy(i => i.item + i.item_type);
  t.equal(Object.values(taxCreditCounts).every(c => c === 1), true);

  const posRebates = _.keyBy(data.pos_rebate_incentives, 'item');
  t.equal(posRebates['Electric Panel'].eligible, false);
  t.equal(posRebates['Electric Panel'].amount, 4000);
  t.equal(posRebates['Electric Panel'].start_date, 2023);
  t.equal(posRebates['Electric Stove'].eligible, false);
  t.equal(posRebates['Electric Stove'].amount, 840);
  t.equal(posRebates['Electric Stove'].start_date, 2023);
  t.equal(posRebates['Electric Wiring'].eligible, false);
  t.equal(posRebates['Electric Wiring'].amount, 2500);
  t.equal(posRebates['Electric Wiring'].start_date, 2023);
  t.equal(posRebates['Heat Pump Water Heater'].eligible, false);
  t.equal(posRebates['Heat Pump Water Heater'].amount, 1750);
  t.equal(posRebates['Heat Pump Water Heater'].start_date, 2023);
  t.equal(posRebates['Heat Pump Air Conditioner/Heater'].eligible, false);
  t.equal(posRebates['Heat Pump Air Conditioner/Heater'].amount, 8000);
  t.equal(posRebates['Heat Pump Air Conditioner/Heater'].start_date, 2023);
  t.equal(posRebates['Heat Pump Clothes Dryer'].eligible, false);
  t.equal(posRebates['Heat Pump Clothes Dryer'].amount, 840);
  t.equal(posRebates['Heat Pump Clothes Dryer'].start_date, 2023);
  t.equal(posRebates['Weatherization'].eligible, false);
  t.equal(posRebates['Weatherization'].amount, 1600);
  t.equal(posRebates['Weatherization'].start_date, 2023);
  // only efficiency rebates are eligible here:
  t.equal(posRebates['Efficiency Rebates'].eligible, true);
  t.equal(posRebates['Efficiency Rebates'].amount, 4000);
  t.equal(posRebates['Efficiency Rebates'].start_date, 2023);

  const taxCredits = _.keyBy(data.tax_credit_incentives, 'item');
  t.equal(taxCredits['Battery Storage Installation'].eligible, true);
  t.equal(taxCredits['Battery Storage Installation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['Battery Storage Installation'].start_date, 2023);
  t.equal(taxCredits['Geothermal Heating Installation'].eligible, true);
  t.equal(taxCredits['Geothermal Heating Installation'].amount, 0.3); // will be displayed as 30%
  t.equal(taxCredits['Geothermal Heating Installation'].start_date, 2022);
  t.equal(taxCredits['Electric Panel'].eligible, true);
  t.equal(taxCredits['Electric Panel'].amount, 600);
  t.equal(taxCredits['Electric Panel'].start_date, 2023);
  t.equal(taxCredits['Electric Vehicle Charger'].eligible, true);
  t.equal(taxCredits['Electric Vehicle Charger'].amount, 1000);
  t.equal(taxCredits['Electric Vehicle Charger'].start_date, 2023);
  t.equal(taxCredits['Heat Pump Air Conditioner/Heater'].eligible, true);
  t.equal(taxCredits['Heat Pump Air Conditioner/Heater'].amount, 2000);
  t.equal(taxCredits['Heat Pump Air Conditioner/Heater'].start_date, 2023);
  t.equal(taxCredits['Heat Pump Water Heater'].eligible, true);
  t.equal(taxCredits['Heat Pump Water Heater'].amount, 2000);
  t.equal(taxCredits['Heat Pump Water Heater'].start_date, 2023);
  t.equal(taxCredits['Rooftop Solar Installation'].eligible, true);
  // solar comes back as dollars even though it will be displayed as %
  t.equal(taxCredits['Rooftop Solar Installation'].amount, 4428.9);
  t.equal(taxCredits['Rooftop Solar Installation'].start_date, 2022);
  t.equal(taxCredits['Weatherization'].eligible, true);
  t.equal(taxCredits['Weatherization'].amount, 1200);
  t.equal(taxCredits['Weatherization'].start_date, 2023);
  // everything except new and used EVs should be eligible:
  t.equal(taxCredits['New Electric Vehicle'].eligible, false);
  t.equal(taxCredits['New Electric Vehicle'].amount, 7500);
  t.equal(taxCredits['New Electric Vehicle'].start_date, 2023);
  t.equal(taxCredits['Used Electric Vehicle'].eligible, false);
  t.equal(taxCredits['Used Electric Vehicle'].amount, 4000);
  t.equal(taxCredits['Used Electric Vehicle'].start_date, 2023);
});
