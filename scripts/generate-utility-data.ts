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
import { createAuthorityName } from './lib/authority-and-program-updater';
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

  const keyCodeOut = stringify({
    header: true,
    columns: ['key', 'external_id'],
  });
  keyCodeOut.pipe(fs.createWriteStream(path.join(__dirname, '../eia-ids.csv')));

  // For deduplication by utility ID and zip.
  //const seen = new Set<string>();
  //const utilitiesByState = new Map<string, Map<string, { name: string }>>();

  const keyToCode = new Map<string, Set<string>>();

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

    if (typeof row.Zip === 'string' && parseInt(row.Zip) < 127) {
      continue;
    }

    const sheetName =
      OVERRIDES.get(parseInt(row.UtilityCode)) ??
      OVERRIDES.get(row.UtilityName) ??
      row.UtilityName;
    const { id } = convertName(sheetName, row.State);

    const existingCodes = keyToCode.get(id);
    if (existingCodes) {
      existingCodes.add(row.UtilityCode);
    } else {
      keyToCode.set(id, new Set([row.UtilityCode]));
    }
  }

  const allKeys = Array.from(keyToCode.keys());
  allKeys.sort(
    (a, b) =>
      keyToCode.get(b)!.size - keyToCode.get(a)!.size || a.localeCompare(b),
  );

  for (const key of allKeys) {
    const codes = keyToCode.get(key)!;
    for (const code of codes) {
      keyCodeOut.write({ key, external_id: code });
    }
  }
})();
