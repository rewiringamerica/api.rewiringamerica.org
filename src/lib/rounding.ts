export function roundCents(dollars: number): number {
  return Math.round(dollars * 100) / 100;
}

export function roundFiftyDollars(dollars: number): number {
  return Math.round(dollars / 50) * 50;
}
