// import {
//   FilingStatus,
//   IAmiLookupResult,
//   ICalculatedIncentiveResults,
//   OwnerStatus,
// } from 'typedefs/ira';

import _filter from 'lodash/filter.js';
import _find from 'lodash/find.js';
import _uniqBy from 'lodash/uniqBy.js';
import estimateTaxAmount from './tax-brackets.js';
import incentives from '../data/ira_incentives.json' assert { type: 'json' };
import solarPrices from '../data/solar_prices.json' assert { type: 'json' };
import stateMFIs from '../data/state_mfi.json' assert { type: 'json' };

const MAX_POS_SAVINGS = 14000;

export default function calculateIncentives(
  ami_result, //: IAmiLookupResult,
  {
    owner_status, //: OwnerStatus,
    household_income, //: number,
    tax_filing, //: FilingStatus,
    household_size, //: number,
  }
) { //: Promise<ICalculatedIncentiveResults> {
  let pos_savings = 0;
  let tax_savings = 0;
  let performance_rebate_total = 0;
  const eligibleIncentives = [];
  const ineligibleIncentives = [];

  if (household_size === 0 || household_income === 0) {
    throw true;
  }

  if (isNaN(household_size) || isNaN(household_income) || !owner_status) {
    throw true;
  }

  const { location, ami, calculations } = ami_result;

  // console.log('calculations', calculations);

  const solarTaxCredit = solarPrices[location?.state_name]?.tax_credit;
  const stateMFI = stateMFIs[location?.state_name];
  const isUnder80Ami = household_income < Number(ami[`l80_${household_size}`]);
  const isUnder150Ami = household_income < Number(ami[`l150_${household_size}`]);
  const isOver150Ami = household_income >= Number(ami[`l150_${household_size}`]);

  // console.log('stateMFI', stateMFI);

  // Loop through each of the incentives, running several tests to see if visitor is eligible
  for (const item of incentives) {
    let eligible = true;
    let amount = item.amount;

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
      if (household_size < 1 || household_size > 8) {
        throw new Error('Invalid household size, values over 8 currently not processable');
      }

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
    // 5) Add the Rooftop Solar Credit amount
    //
    if (item.item_type === 'solar_tax_credit') {
      amount = solarTaxCredit;
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
      eligibleIncentives.push({ ...item, amount, eligible });
    } else {
      ineligibleIncentives.push({ ...item, amount, eligible });
    }
  }

  // Remove items in ineligible section that display in eligible section
  const dedupedIneligibleIncentives = _uniqBy(
    _filter(ineligibleIncentives, item => {
      if (_find(eligibleIncentives, { item: item.item, item_type: item.item_type })) return false;
      return true;
    }),
    item => item.item + item.item_type,
  );

  const calculatedIncentives = [...eligibleIncentives, ...dedupedIneligibleIncentives];

  //
  // Loop through every eligible incentive and add any with an "immediate" dollar value
  //
  for (const item of calculatedIncentives) {
    if (!item.eligible) {
      continue;
    }

    if (item.item_type === 'pos_rebate') {
      pos_savings += item.amount;
    } else if (
      item.item_type === 'solar_tax_credit' ||
      (item.item_type === 'tax_credit' && item.amount_type === 'dollar_amount')
    ) {
      tax_savings += item.representative_amount || item.amount;
    } else if (
      item.item_type === 'tax_credit' &&
      item.amount_type === 'percent' &&
      item.representative_amount > 0
    ) {
      tax_savings += item.representative_amount;
    } else if (item.item_type === 'performance_rebate') {
      performance_rebate_total += item.amount;
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
