import Ajv from 'ajv';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import minimist from 'minimist';
import path from 'path';

import { LOW_INCOME_THRESHOLDS_BY_AUTHORITY } from '../src/data/low_income_thresholds';
import {
  CollectedFields,
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
  const invalidPath = file.filepath!.replace('.json', '_invalid.json');
  const rawValidPath = file.filepath!.replace('.json', '_raw.json');
  const rawInvalidPath = file.filepath!.replace('.json', '_raw_invalid.json');

  const standardizer = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    strict,
    lowIncome ? LOW_INCOME_THRESHOLDS_BY_AUTHORITY : null,
  );

  const standardized = rows.map(standardizer.standardize.bind(standardizer));
  const [valids, invalids] = flatToNestedValidate(standardized);
  if (invalids.length > 0) {
    updateJsonFiles(valids, rawValidPath);
    updateJsonFiles(invalids, rawInvalidPath);
    throw new Error(
      'Invalid spreadsheet records found. See raw.json and raw_invalid.json files to debug before converting to API-friendly JSON.',
    );
  } else {
    // Clear existing raw files since all were valid in this run.
    safeDeleteFiles(rawValidPath, rawInvalidPath);
  }

  const invalid_jsons: StateIncentivesWithErrors[] = [];
  const jsons: StateIncentive[] = [];
  valids.forEach((row: CollectedFields) => {
    const refined = standardizer.refineCollectedData(state, row);
    if (!validate(refined)) {
      const invalid = refined as StateIncentivesWithErrors;
      if (validate.errors !== undefined && validate.errors !== null) {
        invalid.errors = validate.errors;
      }
      invalid_jsons.push(invalid);
    } else {
      jsons.push(refined);
    }
  });
  updateJsonFiles(jsons, file.filepath!);
  updateJsonFiles(invalid_jsons, invalidPath);
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
