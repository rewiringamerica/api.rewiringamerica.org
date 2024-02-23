import Ajv from 'ajv';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import minimist from 'minimist';
import path from 'path';

import {
  LOW_INCOME_THRESHOLDS_BY_AUTHORITY,
  LowIncomeThresholdsMap,
} from '../src/data/low_income_thresholds';
import {
  CollectedIncentive,
  STATE_SCHEMA,
  StateIncentive,
} from '../src/data/state_incentives';
import { LOCALIZABLE_STRING_SCHEMA } from '../src/data/types/localizable-string';
import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
import { flatToNestedValidate } from './lib/format-converter';
import { FIELD_MAPPINGS, VALUE_MAPPINGS } from './lib/spreadsheet-mappings';
import { SpreadsheetStandardizer } from './lib/spreadsheet-standardizer';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.addSchema(LOCALIZABLE_STRING_SCHEMA).compile(STATE_SCHEMA);

type StateIncentivesWithErrors = Partial<StateIncentive> & {
  errors: object[];
};

type SpreadsheetConversionOutput = {
  invalidCollectedIncentives: Record<string, string | object>[];
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

function updateJsonFiles(records: object[], filepath: string) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  if (records.length === 0) {
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
): SpreadsheetConversionOutput {
  const standardizer = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    strict,
    lowIncome,
  );

  const standardized = rows.map(standardizer.standardize.bind(standardizer));
  const validated = flatToNestedValidate(standardized);
  const validCollectedIncentives = validated[0];
  let invalidCollectedIncentives = validated[1];
  // Filter out unfilled rows at the end of the spreadsheet
  // where we prepopulated IDs but nothing else is filled in.
  // The two keys we expect are ID and errors.
  invalidCollectedIncentives = invalidCollectedIncentives.filter(
    invalid => Object.keys(invalid).length > 2,
  );
  const invalidStateIncentives: StateIncentivesWithErrors[] = [];
  const validStateIncentives: StateIncentive[] = [];
  validCollectedIncentives.forEach((row: CollectedIncentive) => {
    const refined = standardizer.refineCollectedData(state, row);
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
    invalidStateIncentives,
    validStateIncentives,
  };
}

async function convertToJson(
  state: string,
  file: IncentiveFile,
  strict: boolean,
  lowIncome: boolean,
) {
  if (lowIncome && !(state in LOW_INCOME_THRESHOLDS_BY_AUTHORITY)) {
    throw new Error(
      `No low-income thresholds defined for ${state} - define them or turn off strict mode.`,
    );
  }
  const response = await fetch(file.sheetUrl);
  const csvContent = await response.text();
  const rows = parse(csvContent, {
    columns: true,
    from_line: file.headerRowNumber ?? 1,
  });

  const {
    invalidCollectedIncentives,
    invalidStateIncentives,
    validStateIncentives,
  } = await spreadsheetToJson(
    state,
    rows,
    strict,
    lowIncome ? LOW_INCOME_THRESHOLDS_BY_AUTHORITY : null,
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
  updateJsonFiles(validStateIncentives, file.filepath);
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
    boolean: ['strict', 'skip_low_income'],
  });

  const bad = args._.filter(f => !(f in FILES));
  if (bad.length) {
    console.error(
      `${bad.join(', ')} not valid (choices: ${Object.keys(FILES).join(', ')})`,
    );
    process.exit(1);
  }

  // Flip boolean so we can have low-income be the default
  // command-line arg, but then pass around a more intuitive
  // boolean after that.
  const lowIncome = args.skip_low_income ? false : true;

  args._.forEach(async fileIdent => {
    await convertToJson(fileIdent, FILES[fileIdent], args.strict, lowIncome);
  });
})();
