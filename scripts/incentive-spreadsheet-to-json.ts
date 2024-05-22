import Ajv from 'ajv';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import { google, sheets_v4 } from 'googleapis';
import fetch from 'make-fetch-happen';
import minimist from 'minimist';
import path from 'path';

import { GaxiosPromise } from 'gaxios';
import { GEO_GROUPS_BY_STATE, GeoGroupsByState } from '../src/data/geo_groups';
import {
  LOW_INCOME_THRESHOLDS_BY_STATE,
  LowIncomeThresholdsMap,
} from '../src/data/low_income_thresholds';
import {
  CollectedIncentive,
  STATE_SCHEMA,
  StateIncentive,
} from '../src/data/state_incentives';
import { LOCALIZABLE_STRING_SCHEMA } from '../src/data/types/localizable-string';
import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
import { authorize } from './lib/auth-helper';
import { DataRefiner } from './lib/data-refiner';
import {
  CollectedIncentivesWithErrors,
  LinkMode,
  flatToNestedValidate,
  googleSheetToFlatData,
} from './lib/format-converter';
import { FIELD_MAPPINGS, VALUE_MAPPINGS } from './lib/spreadsheet-mappings';
import { SpreadsheetStandardizer } from './lib/spreadsheet-standardizer';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.addSchema(LOCALIZABLE_STRING_SCHEMA).compile(STATE_SCHEMA);

export type StateIncentivesWithErrors = Partial<StateIncentive> & {
  errors: object[];
};

type SpreadsheetConversionOutput = {
  invalidCollectedIncentives: CollectedIncentivesWithErrors[];
  validCollectedIncentives: CollectedIncentive[];
  invalidStateIncentives: StateIncentivesWithErrors[];
  validStateIncentives: StateIncentive[];
};

function safeDeleteFiles(...filepaths: string[]) {
  for (const filepath of filepaths) {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}

function updateJsonFiles(
  records: object[],
  filepath: string,
  deleteEmpty: boolean = true,
) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  if (records.length === 0 && deleteEmpty) {
    safeDeleteFiles(filepath);
  } else {
    fs.writeFileSync(
      filepath,
      JSON.stringify(records, null, 2) + '\n',
      'utf-8',
    );
  }
}

export function spreadsheetToJson(
  state: string,
  rows: Record<string, string>[],
  strict: boolean,
  lowIncome: LowIncomeThresholdsMap | null,
  geoGroups: GeoGroupsByState | null,
): SpreadsheetConversionOutput {
  const standardizer = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    strict,
  );
  const refiner = new DataRefiner(lowIncome, geoGroups);

  const standardized = rows.map(standardizer.standardize.bind(standardizer));
  const validated = flatToNestedValidate(standardized);
  // For now, anything marked as omit_from_api is dropped. We may eventually
  // return these anyway even though they are not really errors.
  const validCollectedIncentives = validated[0].filter(
    incentive => !incentive.omit_from_api,
  );
  let invalidCollectedIncentives = validated[1].filter(
    incentive => !incentive.omit_from_api,
  );
  // Filter out unfilled rows at the end of the spreadsheet
  // where we prepopulated IDs but nothing else is filled in.
  // The two keys we expect are ID and errors.
  invalidCollectedIncentives = invalidCollectedIncentives.filter(
    invalid => Object.keys(invalid).length > 2,
  );
  const invalidStateIncentives: StateIncentivesWithErrors[] = [];
  const validStateIncentives: StateIncentive[] = [];
  validCollectedIncentives.forEach((row: CollectedIncentive) => {
    const refined = refiner.refineCollectedData(state, row);
    if (!validate(refined)) {
      const invalid = refined as StateIncentivesWithErrors;
      if (validate.errors !== undefined && validate.errors !== null) {
        invalid.errors = validate.errors;
      }
      invalidStateIncentives.push(invalid);
    } else {
      validStateIncentives.push(refined);
    }
  });
  return {
    invalidCollectedIncentives,
    validCollectedIncentives,
    invalidStateIncentives,
    validStateIncentives,
  };
}

type UrlParts = {
  spreadsheetId: string;
  incentiveDataSheetId: number;
};

const urlRegex = new RegExp(
  'https://docs.google.com/spreadsheets/d/(.*)/pub\\?gid=([0-9]+)&.*',
);
export function extractIdsFromUrl(url: string): UrlParts {
  const match = url.match(urlRegex);
  if (!match) {
    throw new Error(`Could not extract IDs from URL: ${url}`);
  }
  return {
    spreadsheetId: match[1],
    incentiveDataSheetId: +match[2],
  };
}

export interface SheetsClient {
  spreadsheets: {
    get: (req: {
      spreadsheetId: string;
      includeGridData: boolean;
    }) => GaxiosPromise<sheets_v4.Schema$Spreadsheet>;
  };
}

export async function retrieveGoogleSheet(
  file: IncentiveFile,
  client: SheetsClient,
): Promise<sheets_v4.Schema$Sheet> {
  const { spreadsheetId, incentiveDataSheetId } = extractIdsFromUrl(
    file.sheetUrl,
  );

  const resp = await client.spreadsheets.get({
    spreadsheetId: spreadsheetId,
    includeGridData: true,
  });
  if (resp.status !== 200) {
    throw new Error(
      `Status from Google Sheets API not okay: ${resp.status}. Details: ${resp.statusText}`,
    );
  }
  for (const sheet of resp.data.sheets!) {
    if (sheet.properties?.sheetId === incentiveDataSheetId) {
      return sheet;
    }
  }
  throw new Error(
    `No sheet found with sheet ID ${incentiveDataSheetId} for original URL ${file.sheetUrl}. This is likely a non-standard URL.`,
  );
}

async function convertToJson(
  state: string,
  file: IncentiveFile,
  strict: boolean,
  lowIncome: boolean,
  geoGroups: boolean,
) {
  if (lowIncome && !(state in LOW_INCOME_THRESHOLDS_BY_STATE)) {
    throw new Error(
      `No low-income thresholds defined for ${state} - define them or turn off strict mode.`,
    );
  }

  let rows: Record<string, string>[];
  if (file.collectedFilepath) {
    const auth = await authorize();
    if (!auth) {
      throw new Error(
        'Unable to authenticate to Google Sheets API. Confirm you have credentials in the secrets/ folder.',
      );
    }
    const sheetsClient = google.sheets({ version: 'v4', auth: auth });
    const data = await retrieveGoogleSheet(file, sheetsClient);
    rows = googleSheetToFlatData(
      data,
      LinkMode.Convert,
      file.headerRowNumber ?? 1,
    );
  } else {
    const response = await fetch(file.sheetUrl);
    const csvContent = await response.text();
    rows = parse(csvContent, {
      columns: true,
      from_line: file.headerRowNumber ?? 1,
    });
  }

  const {
    invalidCollectedIncentives,
    validCollectedIncentives,
    invalidStateIncentives,
    validStateIncentives,
  } = await spreadsheetToJson(
    state,
    rows,
    strict,
    lowIncome ? LOW_INCOME_THRESHOLDS_BY_STATE : null,
    geoGroups ? GEO_GROUPS_BY_STATE : null,
  );

  const invalidCollectedPath = file.filepath.replace(
    '.json',
    '_invalid_collected.json',
  );
  const invalidStatePath = file.filepath.replace(
    '.json',
    '_invalid_state.json',
  );
  updateJsonFiles(invalidCollectedIncentives, invalidCollectedPath);
  updateJsonFiles(invalidStateIncentives, invalidStatePath);
  if (file.collectedFilepath) {
    updateJsonFiles(validCollectedIncentives, file.collectedFilepath);
  }
  // Pass deleteEmpty = false since missing incentives files cause compilation errors.
  updateJsonFiles(validStateIncentives, file.filepath, false);
  if (
    invalidCollectedIncentives.length > 0 ||
    invalidStateIncentives.length > 0
  ) {
    throw new Error(
      `Some records failed validation. See ${invalidCollectedPath} and/or ${invalidStatePath} to debug errors.`,
    );
  }
}

(async function () {
  const args = minimist(process.argv.slice(2), {
    boolean: ['strict', 'skip_low_income', 'skip_geo_groups'],
  });

  const bad = args._.filter(f => !(f in FILES));
  if (bad.length) {
    console.error(
      `${bad.join(', ')} not valid (choices: ${Object.keys(FILES).join(', ')})`,
    );
    process.exit(1);
  }

  // Flip boolean so we can have the command-line interface result in the
  // behavior being on by default, but then pass around a more intuitive
  // boolean after that.
  const lowIncome = args.skip_low_income ? false : true;
  const geoGroups = args.skip_geo_groups ? false : true;

  args._.forEach(async fileIdent => {
    await convertToJson(
      fileIdent,
      FILES[fileIdent],
      args.strict,
      lowIncome,
      geoGroups,
    );
  });
})();
