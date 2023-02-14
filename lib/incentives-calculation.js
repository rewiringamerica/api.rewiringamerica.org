import _ from 'lodash';
import estimateTaxAmount from './tax-brackets.js';
import fs from 'fs';

const INCENTIVES = JSON.parse(fs.readFileSync('./data/ira_incentives.json', 'utf-8'));
const SOLAR_PRICES = JSON.parse(fs.readFileSync('./data/solar_prices.json', 'utf-8'));
const STATE_MFIS = JSON.parse(fs.readFileSync('./data/state_mfi.json', 'utf-8'));

const MAX_POS_SAVINGS = 14000;
const OWNER_STATUSES = new Set(['homeowner', 'renter']);
const TAX_FILINGS = new Set(['single', 'joint', 'hoh']);

INCENTIVES.forEach(incentive => Object.freeze(incentive));

function roundCents(dollars) {
  return Math.round(dollars * 100) / 100;
}

export default function calculateIncentives(
  { location: { state_id },
    ami,
    calculations,
    geographicQualifiers },
  {
    owner_status,
    household_income,
    tax_filing,
    household_size,
  }
) {
  let pos_savings = 0;
  let tax_savings = 0;
  let performance_rebate_total = 0;
  const eligibleIncentives = [];
  const ineligibleIncentives = [];

  if (!state_id || !ami || !calculations) {
    throw new Error("Geographic eligibility information required.");
  }

  if (!OWNER_STATUSES.has(owner_status)) {
    throw new Error("Unknown owner_status");
  }

  if (!TAX_FILINGS.has(tax_filing)) {
    throw new Error("Unknown tax_filing.");
  }

  if (isNaN(household_income) || household_income < 0 || household_income > 100000000) {
    throw new Error("Invalid household_income. Must be >= 0 and <= 100000000");
  }

  if (isNaN(household_size) || household_size < 1 || household_size > 8) {
    throw new Error('Invalid household size. Must be a number between 1 and 8.');
  }

  const solarSystemCost = SOLAR_PRICES[state_id]?.system_cost;
  const stateMFI = STATE_MFIS[state_id];

  if (isNaN(solarSystemCost) || isNaN(stateMFI?.TOTAL)) {
    throw new Error('Invalid state id provided. Must be US state code or DC.')
  }

  const isUnder80Ami = household_income < Number(ami[`l80_${household_size}`]);
  const isUnder150Ami = household_income < Number(ami[`l150_${household_size}`]);
  const isOver150Ami = household_income >= Number(ami[`l150_${household_size}`]);

  // Loop through each of the incentives, running several tests to see if visitor is eligible
  for (const item of INCENTIVES) {
    let eligible = true;
    let representative_amount = item.representative_amount;

    //
    // 1) Verify that the selected homeowner status qualifies
    //
    if (!item.owner_status.includes(owner_status)) {
      eligible = false;
    }

    //
    // 2) Verify that the given income falls within defined AMI limits, if defined
    //
    if (item.ami_qualification) {
      if (
        (item.ami_qualification === 'less_than_80_ami' &&
          household_income >= Number(ami[`l80_${household_size}`])) ||
        (item.ami_qualification === 'more_than_80_ami' &&
          household_income < Number(ami[`l80_${household_size}`])) ||
        (item.ami_qualification === 'less_than_150_ami' &&
          (household_income < Number(ami[`l80_${household_size}`]) ||
            household_income >= Number(ami[`l150_${household_size}`])))
      ) {
        eligible = false;
      }
    }

    //
    // 3) Verify that overall income limits not exceeded
    //
    if (item.agi_max_limit) {
      if (Number(household_income) >= Number(item.agi_max_limit)) {
        eligible = false;
      }
    }

    //
    // 4) Verify tax filing status is eligible for benfit
    //
    if (item.filing_status) {
      if (item.filing_status !== tax_filing) {
        eligible = false;
      }
    }

    //
    // 5) Assess geographic eligibility against known qualifiers. One or more = true.
    //
    if (item.geographic_qualification) {
      const got = new Set(geographicQualifiers);
      eligible = item.geographic_qualification.some(qual => got.has(qual));
    }

    //
    // 6) Add the Rooftop Solar Credit amount
    //
    if (item.item_type === 'solar_tax_credit' || item.item_type === 'solar_itc') {
      representative_amount = roundCents(solarSystemCost * item.amount);
    }

    if (item.item_type === 'ev_charger_credit') {
      // console.log(
      //   'EV Charger Qualifications:',
      //   '\nIs Rural?',
      //   !calculations.isUrban,
      //   '\nPoverty rate is greater than or equal to 20%?',
      //   calculations.highestPovertyRate >= 0.2,
      //   '\nNon-metro highest MFI is not greater than 80% state MFI',
      //   ami.metro === '0' && calculations.highestMFI < stateMFI.TOTAL * 0.8,
      //   '\nMetro highest MFI is not greater than 80% state MFI OR highest MFI is not greater than 80% median AMI?',
      //   ami.metro === '1' &&
      //     (calculations.highestMFI < stateMFI.TOTAL * 0.8 ||
      //       calculations.highestMFI < Number(ami.median2022) * 0.8),
      // );

      if (
        !calculations.isUrban ||
        calculations.highestPovertyRate >= 0.2 ||
        (ami.metro === '0' && calculations.highestMFI < stateMFI.TOTAL * 0.8) ||
        (ami.metro === '1' &&
          (calculations.highestMFI < stateMFI.TOTAL * 0.8 ||
            calculations.highestMFI < Number(ami.median2022) * 0.8))
      ) {
        // @TODO: The above logic was inverted to be truthy statements, but the
        // logic for incentives is calculated with true-as-default and needs to be negated
        // so this express should do nothing and the "else" corrects the incentive state
        eligible = true;
      } else {
        eligible = false;
      }
    }

    if (eligible) {
      eligibleIncentives.push({ ...item, representative_amount, eligible });
    } else {
      ineligibleIncentives.push({ ...item, representative_amount, eligible });
    }
  }

  // Remove items in ineligible section that display in eligible section
  const dedupedIneligibleIncentives = _.uniqBy(
    ineligibleIncentives.filter(item => {
      // Note: using _ here because it finds by matching properties, not by equality
      const key = { item: item.item, item_type: item.item_type };
      return _.find(eligibleIncentives, key) === undefined;
    }),
    item => item.item + item.item_type,
  );

  const calculatedIncentives = [...eligibleIncentives, ...dedupedIneligibleIncentives];

  //
  // Loop through every eligible incentive and add any with an "immediate" dollar value
  //
  for (const item of eligibleIncentives) {
    if (item.type === 'pos_rebate') {
      // count performance rebates separately
      if (item.item_type === 'performance_rebate') {
        performance_rebate_total += item.amount;
      } else {
        pos_savings += item.amount;
      }
    } else if (item.type === 'tax_credit') {
      // if this is a dollar amount, just add it up:
      if (item.amount_type == 'dollar_amount') {
        tax_savings += item.amount;
      } else if (item.representative_amount) {
        // otherwise, it's a percentage. If there's a representative amount, use that:
        tax_savings += item.representative_amount;
      }
    } else {
      throw new Error(`Unknown item_type: ${item.type}`);
    }
  }

  // Get tax owed to determine max potiental tax savings
  const tax = estimateTaxAmount(tax_filing, household_income);

  return {
    is_under_80_ami: isUnder80Ami,
    is_under_150_ami: isUnder150Ami,
    is_over_150_ami: isOver150Ami,

    // The max POS savings is $14,000 if you're under 150% ami, otherwise 0
    pos_savings: isUnder150Ami && owner_status !== 'renter' ? MAX_POS_SAVINGS : pos_savings,

    // You can't save more than tax owed. Choose the lesser of tax owed vs tax savings
    tax_savings: tax.tax_owed < tax_savings ? tax.tax_owed : tax_savings,

    // Not prominently displayed
    performance_rebate_savings: performance_rebate_total,

    pos_rebate_incentives: calculatedIncentives.filter(item => item.type === 'pos_rebate'),
    tax_credit_incentives: calculatedIncentives.filter(item => item.type === 'tax_credit'),
  };
}
