/**
 * Corresponds to the "zips" table in sqlite. There are other columns, but
 * state_id is the only one we need.
 */
export type ZipInfo = {
  state_id: string;
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
  location: ZipInfo;
  ami: AMI | undefined;
  calculations: MFI | undefined;
};

export type CompleteIncomeInfo = {
  location: ZipInfo;
  ami: AMI;
  calculations: MFI;
};

export const isCompleteIncomeInfo = (
  info: IncomeInfo,
): info is CompleteIncomeInfo =>
  !!info.location.state_id && !!info.ami && !!info.calculations;
