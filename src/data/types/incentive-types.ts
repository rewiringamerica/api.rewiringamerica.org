/** The general mechanism through which you receive an incentive. */
export enum Type {
  Rebate = 'rebate',
  PosRebate = 'pos_rebate',
  TaxCredit = 'tax_credit',
  AccountCredit = 'account_credit',
  AssistanceProgram = 'assistance_program',
}

export type TypeV0 = Extract<Type, Type.PosRebate | Type.TaxCredit>;

/**
 * A more specific version of the above. This gates specific logic around
 * eligibility, totaling up savings, or estimating the amount of an incentive.
 */
export enum PaymentMethod {
  // TODO this should go away
  EvChargerCredit = 'ev_charger_credit',

  Rebate = 'rebate',
  PerformanceRebate = 'performance_rebate',
  PosRebate = 'pos_rebate',
  TaxCredit = 'tax_credit',
  AccountCredit = 'account_credit',
  AssistanceProgram = 'assistance_program',
}
