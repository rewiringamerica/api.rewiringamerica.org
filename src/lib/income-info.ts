/**
 * Corresponds to the "zips" table in sqlite.
 */
export type GeoInfo = {
  state_id: string;
  zip: string;
  city?: string;
  county?: string;
};

/**
 * Corresponds to the "ami" table in sqlite. There are a bunch of columns that
 * we don't need to look at, and some that we look at using constructed keys
 * (e.g. `l80_${household_size}`).
 */
export type AMI = {
  metro: string;
  median2022: string;
  [colName: string]: string | number;
};

/**
 * Corresponds to an aggregate query on the "tracts" table in sqlite.
 */
export type MFI = {
  // This is either "true" or "false". TODO: sketchy to be doing MAX() on that
  isUrban: string;
  lowestMFI: number;
  highestMFI: number;
  lowestPovertyRate: number;
  highestPovertyRate: number;
};

export type IncomeInfo = {
  location: GeoInfo;
  ami: AMI | undefined;
  calculations: MFI | undefined;
};

export type CompleteIncomeInfo = {
  location: GeoInfo;
  ami: AMI;
  calculations: MFI;
};

export const isCompleteIncomeInfo = (
  info: IncomeInfo,
): info is CompleteIncomeInfo =>
  !!info.location.state_id && !!info.ami && !!info.calculations;
