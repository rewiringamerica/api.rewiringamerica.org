/**
 * Uses hardcoded income limits sourced from NYSERDA's page on EmPower+,
 * generate the corresponding income thresholds in low_income_thresholds.json.
 */

import sqlite3, { Database } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const LOW_INCOME_THRESHOLDS_NAME = 'ny-empower-low';
const MODERATE_INCOME_THRESHOLDS_NAME = 'ny-empower-moderate';
const SOURCE_URL =
  'https://www.nyserda.ny.gov/All-Programs/EmPower-New-York-Program/Eligibility-Guidelines';

function getCountyFips(db: Database, countyName: string): string {
  return db
    .prepare<
      string,
      { county_fips: string }
    >("SELECT county_fips FROM zips WHERE county_name = ? AND state_id = 'NY'")
    .get(countyName)!.county_fips;
}

/**
 * Convert an array like [100, 200, 333] to an object like:
 * { "1": 100, "2": 200, "3": 333 }
 */
function convertToObject(thresholds: number[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (let i = 0; i < thresholds.length; i++) {
    result[`${i + 1}`] = thresholds[i];
  }
  return result;
}

async function main() {
  const db = sqlite3(path.join(__dirname, '../incentives-api.db'));

  const thresholdsPath = path.join(
    __dirname,
    '../data/low_income_thresholds.json',
  );
  const thresholdsJson = JSON.parse(fs.readFileSync(thresholdsPath, 'utf-8'));

  // Low income thresholds under "NY" key
  thresholdsJson[LOW_INCOME_THRESHOLDS_NAME] = {
    type: 'hhsize',
    source_url: SOURCE_URL,
    // Copy in existing incentives array, if any
    incentives: thresholdsJson[LOW_INCOME_THRESHOLDS_NAME]?.incentives ?? [],
    thresholds: convertToObject(data.get('NY')!),
  };

  // Moderate income thresholds under the name of each county
  const moderateThresholds: Record<string, Record<string, number>> = {};
  for (const [countyName, raw] of data.entries()) {
    if (countyName === 'NY') {
      continue;
    }

    const fips = getCountyFips(db, countyName);
    console.log(fips, countyName);
    moderateThresholds[fips] = convertToObject(raw);
  }

  thresholdsJson[MODERATE_INCOME_THRESHOLDS_NAME] = {
    type: 'county-hhsize',
    source_url: SOURCE_URL,
    // Copy in existing incentives array, if any
    incentives:
      thresholdsJson[MODERATE_INCOME_THRESHOLDS_NAME]?.incentives ?? [],
    thresholds: moderateThresholds,
  };

  fs.writeFileSync(
    thresholdsPath,
    JSON.stringify(thresholdsJson, null, 2) + '\n',
  );
}

/**
 * This is sourced from this page:
 * https://www.nyserda.ny.gov/All-Programs/EmPower-New-York-Program/Eligibility-Guidelines
 *
 * View source on that page, and all the way at the bottom you'll see a bit of
 * JS code including this table; just paste it in here to update.
 *
 * The "NY" row is the low-income thresholds, which apply statewide. The other
 * rows are moderate-income thresholds for each county. The numbers in each list
 * are for household sizes 1-10.
 */
// prettier-ignore
const data = new Map([
  ["NY", [36420, 47640, 58848, 70056, 81264, 92472, 94572, 96672, 98772, 100884]],
  ["Albany", [62850, 71800, 80800, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
  ["Allegany", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
  ["Bronx", [79200, 90500, 101800, 113100, 122150, 131200, 140250, 149300, 158340, 167388]],
  ["Broome", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
  ["Cattaraugus", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
  ["Cayuga", [49250, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
  ["Chautauqua", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
  ["Chemung", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Chenango", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Clinton", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Columbia", [52600, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Cortland", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Delaware", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Dutchess", [66300, 75750, 85200, 94650, 108352, 123296, 126096, 128896, 132510, 140082]],
 ["Erie", [52000, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Essex", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Franklin", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Fulton", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Genesee", [50300, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Greene", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Hamilton", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Herkimer", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Jefferson", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
 ["Kings", [79200, 90500, 101800, 113100, 122150, 131200, 140250, 149300, 158340, 167388]],
   ["Lewis", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Livingston", [53200, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Madison", [52300, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Monroe", [53200, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Montgomery", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Nassau", [71400, 81600, 91800, 102000, 110200, 123296, 126500, 134650, 142800, 150960]],
   ["New York", [79200, 90500, 101800, 113100, 122150, 131200, 140250, 149300, 158340, 167388]],
   ["Niagara", [52000, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Oneida", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Onondaga", [52300, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Ontario", [53200, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Orange", [66300, 75750, 85200, 94650, 108352, 123296, 126096, 128896, 132510, 140082]],
   ["Orleans", [53200, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Oswego", [52300, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Otsego", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Putnam", [79200, 90500, 101800, 113100, 122150, 131200, 140250, 149300, 158340, 167388]],
   ["Queens", [79200, 90500, 101800, 113100, 122150, 131200, 140250, 149300, 158340, 167388]],
   ["Rensselaer", [62850, 71800, 80800, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Richmond", [79200, 90500, 101800, 113100, 122150, 131200, 140250, 149300, 158340, 167388]],
   ["Rockland", [79200, 90500, 101800, 113100, 122150, 131200, 140250, 149300, 158340, 167388]],
   ["Saratoga", [62850, 71800, 80800, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Schenectady", [62850, 71800, 80800, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Schoharie", [62850, 71800, 80800, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Schuyler", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Seneca", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["St. Lawrence", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Steuben", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Suffolk", [71400, 81600, 91800, 102000, 110200, 123296, 126500, 134650, 142800, 150960]],
   ["Sullivan", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Tioga", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Tompkins", [59400, 67900, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Ulster", [56950, 65050, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Warren", [50750, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Washington", [50750, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Wayne", [53200, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Westchester", [66750, 76250, 85800, 95300, 108352, 123296, 126096, 128896, 133420, 141044]],
   ["Wyoming", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
   ["Yates", [48560, 63520, 78464, 93408, 108352, 123296, 126096, 128896, 131696, 134512]],
  ]);

main();
