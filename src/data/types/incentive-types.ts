/** The general mechanism through which you receive an incentive. */
export enum Type {
  PosRebate = 'pos_rebate',
  TaxCredit = 'tax_credit',
}

/**
 * A more specific version of the above. This gates specific logic around
 * eligibility, totaling up savings, or estimating the amount of an incentive.
 */
export enum ItemType {
  EvChargerCredit = 'ev_charger_credit',
  PerformanceRebate = 'performance_rebate',
  PosRebate = 'pos_rebate',
  TaxCredit = 'tax_credit',
}
