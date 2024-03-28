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

/**
 * Utility codes (number) or utility names (string) to exclude from
 * consideration. These must be exactly as they appear in the spreadsheet.
 * Not every utility has a code, which is why names can also be used here.
 */
const EXCLUSIONS: Set<string | number> = new Set([
  // AZ
  25060, // Wellton-Mohawk; no electric
  60772, // Buckeye; no electric
  62264, // Hohokam; no electric
  78679, // Ocotillo; no electric

  // CA
  'Bay Area Regional Energy Network (BayREN)', // Not a utility, but a network of local governments to promote efficiency

  // CO
  6752, // Town of Frederick; now served by United Power

  // CT
  9734, // City of Jewett City; no electric

  // DC
  'Washington Gas', // no electric; Utility Code "Not Available"

  // IL
  'Nicor Gas',
  'Peoples Gas',

  // PA
  'Philadelphia Gas Works',

  // VA
  8198, // City of Harrisonburg; no electric
]);

/**
 * Map from utility codes (numbers) or utility names (string) to replacement
 * names. The keys must be exactly as they appear in the spreadsheet. The
 * replacement names will be treated as if they were the name in the sheet.
 * (Not every utility has a code, which is why names can also be used here.)
 *
 * The aim of these replacements is to identify a utility by the name most
 * recognizable to its customers. For example, the dataset commonly lists
 * municipal utilities as "Town of XYZ", but often those utilities use the
 * branding "XYZ Public Utilities" or similar. In some cases it's also to deal
 * with unusual abbreviations, or a complete name change that the dataset hasn't
 * picked up on yet, or the dataset referring to the same utility with different
 * abbreviations (e.g. "XYZ Rural Electric Cooperative" and "XYZ R E C").
 */
const OVERRIDES = new Map<string | number, string>([
  // AZ
  [1241, 'DixiePower'],
  [15048, 'Electrical District No 2 Pinal County'],
  [30518, 'Electrical District No 3 Pinal County'],
  [15049, 'Electrical District No 4 Pinal County'],
  [18280, 'Sulphur Springs Valley Electric Cooperative'],
  [19728, 'UniSource Energy Services'],
  [40165, 'DixiePower'],
  [62683, "Tohono O'odham Utility Authority"],
  [606953, 'UniSource Energy Services'],

  // CA
  [207, 'Alameda Municipal Power'],
  [16088, 'Riverside Public Utilities'],
  [16655, 'Silicon Valley Power'],
  [19229, 'Truckee Donner Public Utility District'],
  [14534, 'Pasadena Water and Power'],
  [16295, 'Roseville Electric'],
  [11124, 'Lodi Electric Utility'],
  [7294, 'Glendale Water and Power'],
  [590, 'Anaheim Public Utilities'],
  [2507, 'Burbank Water and Power'],

  // CO
  [5997, 'Estes Park Power and Communications'],
  [7300, 'Glenwood Springs Electric'],
  [10066, 'K.C. Electric Association'],
  [11256, 'Loveland Water and Power'],
  [12860, 'Morgan County REA'],
  [15257, 'Poudre Valley REA'],
  [16603, 'San Luis Valley REC'],
  [16616, 'San Isabel Electric'],

  // GA
  [9689, 'Jefferson Energy Cooperative'],

  // CT
  [7716, 'Groton Utilities'],
  [13831, 'Norwich Public Utilities'],
  [17569, 'South Norwalk Electric and Water'],

  // DC
  [1143, 'Pepco'], // Potomac Electric Power

  // IL
  [14840, 'Peru Municipal Electric Department'],
  [15686, 'Rantoul Utilities'],
  [4362, 'Corn Belt Energy'],
  [16420, 'Rural Electric Convenience Cooperative'],
  [56697, 'Ameren Illinois'],
  [61678, 'Corn Belt Energy'],

  // MI
  [61241, 'City of Charlevoix'],
  [1366, 'Bay City Electric Light and Power'],
  [3915, 'Coldwater Board of Public Utilities'],
  [8631, 'Hillsdale Board of Public Utilities'],
  [60990, 'Marshall Municipal Utilities'],
  [18895, 'Thumb Electric Cooperative'],
  [21048, 'Wyandotte Municipal Services'],
  [19125, 'Traverse City Light & Power'],

  // NV
  [13407, 'NV Energy'], // Nevada Power (became NV Energy in 2008)
  [17166, 'NV Energy'], // Sierra Pacific Power Co (became NV Energy in 2008)

  // NY
  [1036, 'Con Edison'],
  [1115, 'NYSEG'],
  [1117, 'National Grid'], // Niagara Mohawk
  [3249, 'Central Hudson Gas & Electric'],
  [4226, 'Con Edison'],
  [11811, 'Massena Electric'],
  [13511, 'NYSEG'],
  [14154, 'Orange & Rockland'],
  [16183, 'Rochester Gas & Electric'],
  [16549, 'Salamanca Board of Public Utilities'],

  // OR
  [3264, 'Central Lincoln'],
  [60724, 'Central Lincoln'],
  [28541, 'Clatskanie PUD'],
  [40438, 'Columbia River PUD'],
  [40437, "Emerald People's Utility District"],
  [14109, 'Oregon Trail Electric Cooperative'],
  [18917, "Tillamook People's Utility District"],
  [1736, 'Blachly-Lane Electric Cooperative'],

  // PA
  [12390, 'Met-Ed'],
  [1096, 'Met-Ed'],
  [1135, 'PECO'],
  [14711, 'Penelec'],
  [14716, 'Penn Power'],
  [1188, 'West Penn Power Company'],

  // RI
  [1857, 'Block Island Power Company'],

  // VA
  [1186, 'Dominion Energy'],
  [2248, 'BVU Authority'],
  [4794, 'Danville Utilities'],
  [6715, 'Franklin Municipal Power and Light'],
  [13640, 'NOVEC'],
  [15619, 'Radford Electric Department'],
  [19876, 'Dominion Energy'],
  [60762, 'BVU Authority'],

  // VT
  [1061, 'Green Mountain Power'],
  [7601, 'Green Mountain Power'],
  [8104, 'Town of Hardwick Electric Department'],
  [11305, 'Village of Ludlow Electric Light Department'],
  [11359, 'Lyndon Electric Department'],
  [12989, 'Morrisville Water & Light'],
  [13789, 'Town of Northfield Electric Department'],
  [18371, 'Swanton Electric'],
  [19791, 'Vermont Electric Coop'],
  [27316, 'Stowe Electric Department'],

  // WI
  [307, 'Algoma Utilities'],
  [2273, 'Brodhead Water & Light'],
  [3208, 'Cedarburg Light & Water'],
  [1776, 'Black River Falls Municipal Utilities'],
  [1997, 'Boscobel Utilities'],
  [3814, 'Clintonville Utilities'],
  [4073, 'Columbus Utilties'],
  [4607, 'Cuba City Light & Water'],
  [5777, 'Elkhorn Light & Water'],
  [6043, 'Evansville Water & Light'],
  [10056, 'Kaukauna Utilities'],
  [11125, 'Lodi Utilities'],
  [11740, 'Marshfield Utilities'],
  [12265, 'Medford Electric Utility'],
  [12298, 'Menasha Utilities'],
  [13448, 'New Holstein Utilities'],
  [13481, 'New Richmond Utilities'],
  [15159, 'Plymouth Utilities'],
  [15978, 'City Utilities Richland Center'],
  [16082, 'River Falls Municipal Utilities'],
  [17028, 'Sheboygan Falls Utilities'],
  [18181, 'Stoughton Utilities'],
  [18249, 'Sturgeon Bay Utilities'],
  [20434, 'Westby Utilities'],
  [4247, 'Consolidated Water Power Company'],
  [4715, 'Dahlberg Light & Power Company'],
  [5417, 'Dunn Energy Cooperative'],
  [5632, 'Eau Claire Energy Cooperative'],
  [6424, 'Florence Utilities'],
  [8212, 'Hartford Utilities'],
  [9936, 'Juneau Utilities'],
  [11479, 'Madison Gas and Electric'],
  [13467, 'New London Utilities'],
  [13815, 'Northwestern Wisconsin Electric Company'],
  [13964, 'Oconto Falls Municipal Utilities'],
  [15034, 'Pierce Pepin Cooperative Services'],
  [18336, 'Superior Water, Light & Power'],
  [19324, 'Two Rivers Utilities'],
  [1181, 'Bangor Municipal Utility'],
  [13036, 'Mount Horeb Utilities'],
  [13145, 'Muscoda Utilities'],
  [13438, 'New Glarus Utilities'],
  [20211, 'Waunakee Utilities'],
  [20182, 'Waterloo Utilities'],
  [40036, 'Westfield Milling and Electric Light Company'],
  [20847, 'We Energies'],
  [54921, 'Water Works & Lighting Commission'],
]);

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
  // Spell out "Pwr", "Assn", "Elec", and "Coop"
  // The dataset is inconsistent about this
  cleaned = cleaned.replaceAll(/\bPwr\b/gi, 'Power');
  cleaned = cleaned.replaceAll(/\bAssn\b/gi, 'Association');
  cleaned = cleaned.replaceAll(/\bElec\b/gi, 'Electric');
  cleaned = cleaned.replaceAll(/\bCo-?op\b/gi, 'Cooperative');

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
    // If there's no subdir for the state in /data, skip it entirely.
    const stateDir = path.join(__dirname, `../data/${state}`);
    if (!fs.existsSync(stateDir)) {
      // Return from forEach lambda; move on to next state
      return;
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
