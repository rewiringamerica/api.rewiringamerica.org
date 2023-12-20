/** The general mechanism through which you receive an incentive. */
export enum PaymentMethod {
  Rebate = 'rebate',
  PosRebate = 'pos_rebate',
  TaxCredit = 'tax_credit',
  AccountCredit = 'account_credit',
  AssistanceProgram = 'assistance_program',
  PerformanceRebate = 'performance_rebate',
}

/**
 * Deprecated. TODO: remove
 */
export enum ItemType {
  Rebate = 'rebate',
  PerformanceRebate = 'performance_rebate',
  PosRebate = 'pos_rebate',
  TaxCredit = 'tax_credit',
  AccountCredit = 'account_credit',
  AssistanceProgram = 'assistance_program',
}
