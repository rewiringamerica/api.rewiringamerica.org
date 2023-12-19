/** The general mechanism through which you receive an incentive. */
export enum PaymentMethod {
  Rebate = 'rebate',
  PosRebate = 'pos_rebate',
  TaxCredit = 'tax_credit',
  AccountCredit = 'account_credit',
  AssistanceProgram = 'assistance_program',
}

export type PaymentMethodV0 = Extract<
  PaymentMethod,
  PaymentMethod.PosRebate | PaymentMethod.TaxCredit
>;

/**
 * A more specific version of the above. This gates specific logic around
 * eligibility, totaling up savings, or estimating the amount of an incentive.
 */
export enum ItemType {
  Rebate = 'rebate',
  PerformanceRebate = 'performance_rebate',
  PosRebate = 'pos_rebate',
  TaxCredit = 'tax_credit',
  AccountCredit = 'account_credit',
  AssistanceProgram = 'assistance_program',
}
