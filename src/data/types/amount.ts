export enum AmountType {
  DollarAmount = 'dollar_amount',
  Percent = 'percent',
  PerUnit = 'dollars_per_unit',
}

export enum AmountUnit {
  Ton = 'ton',
  Kilowatt = 'kilowatt',
  Watt = 'watt',
  Btuh10k = 'btuh10k',
  SquareFoot = 'square_foot',
  KilowattHour = 'kilowatt_hour',
}

/**
 * There are four types of amount, with the following rules:
 *
 * - dollar_amount. This must specify "number" as the exact or maximum number
 *   of dollars the incentive is for. Must not have "unit" or "representative".
 *
 *   TODO some also specify "minimum" or "maximum".
 *   For now this is just a marker that there is more to the incentive; it may
 *   be tiered flat amounts depending on equipment specs or some input we're
 *   not capturing, or something more complex.
 *
 * - percent. Number is between 0 and 1. May also have "minimum", "maximum" and
 *   "representative". Must not have "unit".
 *
 * - dollars_per_unit. Number is dollars per unit. "unit" is required. May also
 *   have "minimum" and "maximum" and "representative".
 */
export interface Amount {
  type: AmountType;
  number: number;
  unit?: AmountUnit;
  minimum?: number;
  maximum?: number;
  representative?: number;
}
