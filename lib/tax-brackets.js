import _ from 'lodash';
import fs from 'fs';

const TAX_BRACKETS = JSON.parse(
  fs.readFileSync('./data/tax_brackets.json', 'utf-8'),
);

export default function estimateTaxAmount(filing_status, household_income) {
  // Note: this could be simplified to hardcoded value lookup
  const tax_brackets = TAX_BRACKETS.filter(
    row => filing_status === row.filing_status,
  );

  // Get the Standard Deduction for filing status
  const standardDeductionResult = tax_brackets.find(row => {
    return (
      household_income <= row.income_max && household_income >= row.income_min
    );
  });

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
  });

  // Step 3: Add the tax owed for each of the lower brackets
  const fixedTaxAmount = _.sumBy(fixedBracketResults, 'tax_amount');

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
    tax_owed: Math.ceil(taxOwed), // Math.ceil rounds up any decimal
    effective_rate: effectiveRate,
  };
}
