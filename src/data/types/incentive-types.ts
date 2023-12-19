/** The general mechanism through which you receive an incentive. */
export enum PaymentMethod {
  Rebate = 'rebate',
  PosRebate = 'pos_rebate',
  TaxCredit = 'tax_credit',
  AccountCredit = 'account_credit',
  AssistanceProgram = 'assistance_program',
  PerformanceRebate = 'performance_rebate',
}

/** The subset of the above that is allowed in the IRA static JSON. */
export type PaymentMethodV0 = Extract<
  PaymentMethod,
  | PaymentMethod.PosRebate
  | PaymentMethod.TaxCredit
  | PaymentMethod.PerformanceRebate
>;

/**
 * The subset of the above that is allowed to be in the "type" field in the
 * legacy v0 API.
 */
export type TypeV0 = Extract<
  PaymentMethod,
  PaymentMethod.PosRebate | PaymentMethod.TaxCredit
>;

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
