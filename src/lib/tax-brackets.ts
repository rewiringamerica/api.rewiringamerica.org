import _ from 'lodash';
import { FilingStatus, TAX_BRACKETS } from '../data/tax_brackets';
import { TERRITORIES } from '../data/types/states';
import { TaxEstimate } from '../data/types/tax';
import { roundCents } from './rounding';

// This basically works like deductions in federal taxes. Everyone is allowed to
// claim a "personal exemption", which deducts this amount from taxable income.
// https://www.mass.gov/info-details/massachusetts-personal-income-tax-exemptions
const MA_EXEMPTIONS: { [S in FilingStatus]: number } = {
  [FilingStatus.Single]: 4400,
  [FilingStatus.MarriedFilingSeparately]: 4400,
  [FilingStatus.HoH]: 6800,
  [FilingStatus.Joint]: 8800,
  [FilingStatus.QualifyingWidower]: 8800,
};

// Income over this amount is subject to the 4% surtax (a.k.a. "millionaire's
// tax"). The threshold goes up every year, which is why it's not an even $1M.
// This is for the 2025 tax year.
// https://www.mass.gov/info-details/4-surtax-on-taxable-income-over-1000000
const MA_SURTAX_THRESHOLD = 1_083_150;

// Source: last page of
// https://www.tax.newmexico.gov/individuals/wp-content/uploads/sites/5/2021/12/PIT-rates_2005_2021.pdf
const NM_BRACKETS: {
  [S in FilingStatus]: { maxIncome: number; rate: number }[];
} = {
  [FilingStatus.Single]: [
    { maxIncome: 5500, rate: 0.017 },
    { maxIncome: 11000, rate: 0.032 },
    { maxIncome: 16000, rate: 0.047 },
    { maxIncome: 210000, rate: 0.049 },
    { maxIncome: Infinity, rate: 0.059 },
  ],
  [FilingStatus.MarriedFilingSeparately]: [
    { maxIncome: 4000, rate: 0.017 },
    { maxIncome: 8000, rate: 0.032 },
    { maxIncome: 12000, rate: 0.047 },
    { maxIncome: 157500, rate: 0.049 },
    { maxIncome: Infinity, rate: 0.059 },
  ],
  // Below three all the same
  [FilingStatus.Joint]: [
    { maxIncome: 8000, rate: 0.017 },
    { maxIncome: 16000, rate: 0.032 },
    { maxIncome: 24000, rate: 0.047 },
    { maxIncome: 315000, rate: 0.049 },
    { maxIncome: Infinity, rate: 0.059 },
  ],
  [FilingStatus.HoH]: [
    { maxIncome: 8000, rate: 0.017 },
    { maxIncome: 16000, rate: 0.032 },
    { maxIncome: 24000, rate: 0.047 },
    { maxIncome: 315000, rate: 0.049 },
    { maxIncome: Infinity, rate: 0.059 },
  ],
  [FilingStatus.QualifyingWidower]: [
    { maxIncome: 8000, rate: 0.017 },
    { maxIncome: 16000, rate: 0.032 },
    { maxIncome: 24000, rate: 0.047 },
    { maxIncome: 315000, rate: 0.049 },
    { maxIncome: Infinity, rate: 0.059 },
  ],
};

/**
 * Formula to calculate tax owed to states
 */
export function estimateStateTaxAmount(
  householdIncome: number,
  filingStatus: FilingStatus,
  stateCode: string,
): TaxEstimate | null {
  let taxOwed = null;
  let effectiveRate = null;

  switch (stateCode) {
    /**
     * Colorado has a flat income tax rate of 4.4% on all income earners.
     * The state does not offer a standard deduction.
     */
    case 'CO': {
      effectiveRate = 4.4;
      taxOwed = Math.ceil(householdIncome * (effectiveRate / 100));
      break;
    }

    // MA has a flat rate of 5% on all income, plus 4% on all income over $1MM.
    // This is after applying a "personal exemption"; i.e. basically a standard
    // deduction. (You can get more exemptions for various things, but everyone
    // gets the personal exemption automatically.)
    case 'MA': {
      const exemption = MA_EXEMPTIONS[filingStatus];
      const taxableIncome = householdIncome - exemption;

      // NB: the surtax is not a higher bracket of a graduated rate; it's
      // additional to the flat base rate.
      const baseTax = taxableIncome * 0.05;
      const surtax =
        taxableIncome > MA_SURTAX_THRESHOLD
          ? (taxableIncome - MA_SURTAX_THRESHOLD) * 0.04
          : 0;

      taxOwed = Math.ceil(baseTax + surtax);
      effectiveRate = (taxOwed / householdIncome) * 100;
      break;
    }

    // NM has graduated brackets and no standard deduction.
    case 'NM': {
      const brackets = NM_BRACKETS[filingStatus];
      let prevBracketMax = 0;
      taxOwed = 0;

      for (const { maxIncome, rate } of brackets) {
        taxOwed +=
          (_.min([householdIncome, maxIncome])! - prevBracketMax) * rate;
        if (householdIncome < maxIncome) {
          break;
        }
        prevBracketMax = maxIncome;
      }

      taxOwed = Math.ceil(taxOwed);
      effectiveRate = (taxOwed / householdIncome) * 100;
      break;
    }

    default: {
      return null;
    }
  }

  return { taxOwed, effectiveRate };
}

export function estimateFederalTaxAmount(
  state: string,
  filing_status: FilingStatus,
  household_income: number,
): TaxEstimate {
  // Bona fide residents of the territories don't pay federal income tax on
  // territory-sourced income. We conservatively assume that the user is a bona
  // fide resident and has only territory-sourced income. This means we'll
  // calculate $0 of possible savings from tax credits.
  if ((TERRITORIES as readonly string[]).includes(state)) {
    return { taxOwed: 0, effectiveRate: 0 };
  }

  // Note: this could be simplified to hardcoded value lookup
  const tax_brackets = TAX_BRACKETS.filter(
    row => filing_status === row.filing_status,
  );

  // Get the Standard Deduction for filing status
  const standardDeductionResult = tax_brackets.find(row => {
    return (
      household_income <= row.income_max && household_income >= row.income_min
    );
  })!;

  const standardDeduction = standardDeductionResult.standard_deduction;

  // Step 1: Taxable income is calculated by subtracting standard deduction from household income
  const taxableIncome = Math.max(0, household_income - standardDeduction);

  // Get fixed tax brackets underneath assigned tax bracket to add taxes
  const fixedBracketResults = tax_brackets.filter(row => {
    return row.income_max < taxableIncome;
  });

  // Step 2: Get the correct bracket for taxable income
  const taxBracketResult = tax_brackets.find(row => {
    return taxableIncome <= row.income_max && taxableIncome >= row.income_min;
  })!;

  // Step 3: Add the tax owed for each of the lower brackets
  const fixedTaxAmount = _.sumBy(fixedBracketResults, tb => {
    // Adjustment for calculating width of the lowest bracket
    const incomeMin = tb.income_min === 0 ? 1 : tb.income_min;
    return roundCents((tb.income_max - incomeMin + 1) * tb.tax_rate);
  });

  // Step 4: Subtract min of active bracket from taxable income
  const bracketRemainder = taxableIncome - taxBracketResult.income_min;

  // Step 5: Multiply remainder by tax bracket rate
  const dynamicTaxAmount = bracketRemainder * taxBracketResult.tax_rate;

  // Step 6: Get tax owed
  const taxOwed = fixedTaxAmount + dynamicTaxAmount;

  // Step 7: Get effective tax rate
  const effectiveRate = (taxOwed / household_income) * 100;

  /*console.log('Estimated Tax Amount Proofs');
  console.log('Step 1: taxable income', taxableIncome);
  console.log('Step 2: tax bracket result', taxBracketResult);
  console.log('Step 3: fixed tax amount', fixedTaxAmount);
  console.log('Step 4: bracket remaining amount', bracketRemainder);
  console.log('Step 5: dynamic tax amount', dynamicTaxAmount);
  console.log('Step 6: tax owed', taxOwed);
  console.log('Step 7: effective rate', effectiveRate);*/

  return {
    taxOwed: Math.ceil(taxOwed), // Math.ceil rounds up any decimal
    effectiveRate,
  };
}

export default {
  estimateFederalTaxAmount,
  estimateStateTaxAmount,
};
