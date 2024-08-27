/**
 * Generates two CSV files, ready to be loaded into the runtime SQLite database,
 * from ENERGY STAR's dataset mapping zip codes to utilities.
 *
 * Usage:
 *   generate-utility-data.ts [--file utilities.xlsx]
 *
 * Pass --file to read a local file instead of downloading from the Internet.
 */

import { stringify } from 'csv-stringify';
import fs from 'fs';
import _ from 'lodash';
import fetch from 'make-fetch-happen';
import minimist from 'minimist';
import path from 'path';
import xlsx from 'xlsx';
import {
  createAuthorityName,
  sortMapByKey,
} from './lib/authority-and-program-updater';
import { EXCLUSIONS, OVERRIDES } from './lib/utility-data-overrides';

/**
 * A best-effort attempt to convert the name from the spreadsheet into a
 * utility ID and a user-facing name, as we've done manually.
 */
function convertName(
  name: string,
  state: string,
): { id: string; name: string } {
  let cleaned = name;

  // Remove the " - (XX)" suffix (state codes)
  cleaned = cleaned.replace(/-? *\([A-Z]{2}\)$/, '').trim();
  // Remove square-bracketed parts, which are parent companies not used as the
  // customer-facing brand
  cleaned = cleaned.replace(/\[.*\]/, '').trim();
  // Remove "Inc" or "Co" suffix
  cleaned = cleaned.replace(/\b,?\s+(I(nc)?|Co)\.?$/i, '').trim();
  // Remove "(for __ reporting)" parenthetical
  cleaned = cleaned.replace(/\(.*reporting.*\)/i, '').trim();
  // Spell out "Pwr", "Assn", "Elec", "Coop", and "Dist". Replace some
  // spaced-out abbreviations with un-spaced versions.
  // The dataset is inconsistent about this.
  cleaned = cleaned.replaceAll(/\bPwr\b/gi, 'Power');
  cleaned = cleaned.replaceAll(/\bAssn\b/gi, 'Association');
  cleaned = cleaned.replaceAll(/\bElec\b/gi, 'Electric');
  cleaned = cleaned.replaceAll(/\bCo-?op\b/gi, 'Cooperative');
  cleaned = cleaned.replaceAll(/\bRrl\b/gi, 'Rural');
  cleaned = cleaned.replaceAll(
    /\bEl (Cooperative|Association|Member)\b/gi,
    'Electric $1',
  );
  cleaned = cleaned.replaceAll(/\bR E C$/g, 'REC');
  cleaned = cleaned.replaceAll(/\bR E (M|C) C$/g, 'RE$1C');
  cleaned = cleaned.replaceAll(/\bE (M|C) C$/g, 'E$1C');
  cleaned = cleaned.replaceAll(/\bE (C|P) A$/g, 'E$1A');
  cleaned = cleaned.replaceAll(/\bP P D\b/gi, 'Public Power District');
  cleaned = cleaned.replaceAll(
    /\bPub(lic)? Power Dist\b/gi,
    'Public Power District',
  );

  return { id: createAuthorityName(state, cleaned), name: cleaned };
}

// These must be in the same order as in the spreadsheet
enum Col {
  Zip = 'Zip Code',
  State = 'State',
  UtilityName = 'Utility Name',
  UtilityCode = 'Utility Code',
  Predominant = 'Predominant Utility?',
  Electric = 'Electric?',
  Gas = 'Gas?',
  Steam = 'Steam?',
  Water = 'Water?',
  DataType = 'Data Type',
  AggregateWholeBuilding = 'Aggregate Whole-Building Data?',
  Multifamily = 'Multifamily Included?',
  Contact = 'Contact Person',
  Phone = 'Contact Phone',
  Email = 'Contact Email',
  Website = 'Website',
}

(async () => {
  const args = minimist(process.argv.slice(2), {
    string: ['file'],
  });

  const rawSheet = args.file
    ? fs.readFileSync(args.file)
    : await fetch(
        'https://downloads.energystar.gov/bi/portfolio-manager/Public_Utility_Map_en_US.xlsx',
      ).then(response => response.buffer());

  const sheet = xlsx.read(rawSheet, {
    sheets: 0,
    dense: true,
    cellHTML: false,
    cellText: false,
  }).Sheets['Public Utility Map'];

  /** manually-updated list of utilities that aren't in the Energy Star database
   * editable source: https://docs.google.com/spreadsheets/d/1WW0RHpKCoYsrOUuWFlEaeQpwwpMFSKLBk_pN8WG3jbU/edit?usp=sharing
   * TODO(veekas): determine if we can upstream this to the CUBE
   */
  const rawAdditionalUtilityMapping = fs.readFileSync(
    require.resolve('../scripts/lib/additional-utility-zips.xlsx'),
  );

  const additionalUtilityMapping = xlsx.read(rawAdditionalUtilityMapping, {
    sheets: 0,
    dense: true,
    cellHTML: false,
    cellText: false,
  }).Sheets['Additional Utility Map'];

  // convert data to JSON and remove duplicate header rows
  const additionalUtilityMappingData = xlsx.utils
    .sheet_to_json(additionalUtilityMapping, { header: 1 })
    .slice(3) as unknown[][];

  // append additional utility mapping data to the Energy Star sheet
  xlsx.utils.sheet_add_aoa(sheet, additionalUtilityMappingData, {
    origin: -1,
  });

  type Cell = { v: string };
  const header = sheet[2].map((c: Cell) => c.v);

  if (!_.isEqual(header, Object.values(Col))) {
    console.error('Header row is not as expected:', header);
    return;
  }

  const zipToUtilityOut = stringify({
    header: true,
    columns: ['zip', 'utility_id', 'predominant'],
  });
  zipToUtilityOut.pipe(
    fs.createWriteStream(path.join(__dirname, 'data/zip-to-utility.csv')),
  );

  // For deduplication by utility ID and zip.
  const seen = new Set<string>();
  const utilitiesByState = new Map<string, Map<string, { name: string }>>();

  // Print the last refresh date
  console.log(sheet[0][0].v);

  for (const sheetRow of sheet.slice(3)) {
    const row: { [c in keyof typeof Col]: string } = Object.fromEntries(
      _.zip(
        Object.keys(Col),
        sheetRow.map((c: Cell) => c.v),
      ),
    );

    // Yes = they provide electricity, No = they don't, Not Available = maybe
    if (row.Electric === 'No') {
      continue;
    }

    if (
      EXCLUSIONS.has(parseInt(row.UtilityCode)) ||
      EXCLUSIONS.has(row.UtilityName)
    ) {
      continue;
    }

    const sheetName =
      OVERRIDES.get(parseInt(row.UtilityCode)) ??
      OVERRIDES.get(row.UtilityName) ??
      row.UtilityName;
    const { id, name } = convertName(sheetName, row.State);

    if (seen.has(row.Zip + id)) {
      continue;
    }
    seen.add(row.Zip + id);

    if (!utilitiesByState.has(row.State)) {
      utilitiesByState.set(row.State, new Map());
    }
    utilitiesByState.get(row.State)!.set(id, { name });

    zipToUtilityOut.write({
      zip: row.Zip,
      utility_id: id,
      predominant: row.Predominant === 'Yes' ? 1 : 0,
    });
  }

  // Update each state's authorities.json with the utilities from the dataset.
  utilitiesByState.forEach((utilityMap, state) => {
    // If there's no subdir for the state in /data, create it.
    const stateDir = path.join(__dirname, `../data/${state}`);
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir);
    }

    const filepath = path.join(stateDir, 'authorities.json');
    const authoritiesJson = fs.existsSync(filepath)
      ? JSON.parse(fs.readFileSync(filepath, 'utf-8'))
      : { utility: {} };
    const existingUtilities = authoritiesJson.utility;
    const newUtilities: typeof existingUtilities = {};
    utilityMap.forEach((utility, id) => {
      // Existing utilities in authorities.json may have other info like a
      // logo; preserve that and update only the name
      if (id in existingUtilities) {
        newUtilities[id] = { ...existingUtilities[id], ...utility };
      } else {
        newUtilities[id] = utility;
      }
    });

    // This removes any utilities that aren't in the dataset
    authoritiesJson.utility = sortMapByKey(newUtilities);

    fs.writeFileSync(filepath, JSON.stringify(authoritiesJson, null, 2) + '\n');
  });
})();
