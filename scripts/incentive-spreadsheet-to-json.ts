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

function writeJson(
  valid: string,
  validPath: string,
  invalid: string,
  invalidPath: string,
) {
  const dir = path.dirname(validPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(validPath, valid, 'utf-8');
  if (invalid.length === 0) {
    if (fs.existsSync(invalidPath)) {
      // Clear any previous versions if we have no invalid records.
      fs.unlinkSync(invalidPath);
    }
  } else {
    fs.writeFileSync(invalidPath, invalid, 'utf-8');
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

  const standardizer = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    strict,
    lowIncome ? LOW_INCOME_THRESHOLDS_BY_AUTHORITY : null,
  );

  const standardized = rows.map(standardizer.standardize.bind(standardizer));

  const [valids, invalids] = flatToNestedValidate(standardized);
  if (invalids.length > 0) {
    writeJson(
      JSON.stringify(valids, null, 2) + '\n',
      file.filepath.replace('.json', '_raw.json'),
      JSON.stringify(invalids, null, 2) + '\n',
      file.filepath.replace('.json', '_raw_invalid.json'),
    );
    throw new Error(
      'Invalid spreadsheet records found. See raw.json and raw_invalid.json files to debug before converting to API-friendly JSON.',
    );
  }

  type StateIncentivesWithErrors = Partial<StateIncentive> & {
    errors: object[];
  };
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

  writeJson(
    JSON.stringify(jsons, null, 2) + '\n',
    file.filepath,
    JSON.stringify(invalid_jsons, null, 2) + '\n',
    file.filepath.replace('.json', '_invalid.json'),
  );
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
