import Ajv from 'ajv';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import minimist from 'minimist';
import path from 'path';

import { LOW_INCOME_THRESHOLDS_BY_AUTHORITY } from '../src/data/low_income_thresholds';
import {
  CollectedStateIncentive,
  STATE_SCHEMA,
  StateIncentive,
} from '../src/data/state_incentives';
import { LOCALIZABLE_STRING_SCHEMA } from '../src/data/types/localizable-string';
import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
import { csvToJsonData } from './lib/format-converter';
import { FIELD_MAPPINGS, VALUE_MAPPINGS } from './lib/spreadsheet-mappings';
import { SpreadsheetStandardizer } from './lib/spreadsheet-standardizer';

const ajv = new Ajv({ allErrors: true });

const validate = ajv.addSchema(LOCALIZABLE_STRING_SCHEMA).compile(STATE_SCHEMA);

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

  const converter = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    strict,
    lowIncome ? LOW_INCOME_THRESHOLDS_BY_AUTHORITY : null,
  );

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const renamed = rows.map((row: any) => converter.convertFieldNames(row));
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const [valids, invalids] = csvToJsonData(renamed);
  if (invalids.length > 0) {
    const validPath = file.filepath.replace('.json', '_raw.json');
    const invalidPath = file.filepath.replace('.json', '_raw_invalid.json');
    const dir = path.dirname(file.filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    fs.writeFileSync(
      validPath,
      JSON.stringify(valids, null, 2) + '\n', // include newline to satisfy prettier
      'utf-8',
    );
    if (invalids.length === 0) {
      if (fs.existsSync(invalidPath)) {
        // Clear any previous versions if we have no invalid records.
        fs.unlinkSync(invalidPath);
      }
    } else {
      fs.writeFileSync(
        invalidPath,
        JSON.stringify(invalids, null, 2) + '\n', // include newline to satisfy prettier
        'utf-8',
      );
    }
    throw new Error(
      'Invalid spreadsheet records found. See raw.json and raw_invalid.json files to debug before converting to API-friendly JSON.',
    );
  }

  const invalid_jsons: Record<string, string | number | boolean | object>[] =
    [];
  const jsons: StateIncentive[] = [];
  valids.forEach((row: CollectedStateIncentive) => {
    const standardized = converter.recordToStandardValues(state, row);
    if (!validate(standardized)) {
      if (validate.errors !== undefined && validate.errors !== null) {
        standardized.errors = validate.errors;
      }
      invalid_jsons.push(standardized);
    } else {
      jsons.push(standardized);
    }
  });

  const dir = path.dirname(file.filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(
    file.filepath,
    JSON.stringify(jsons, null, 2) + '\n', // include newline to satisfy prettier
    'utf-8',
  );
  const invalidsFilePath = file.filepath.replace('.json', '_invalid.json');
  if (invalid_jsons.length === 0) {
    if (fs.existsSync(invalidsFilePath)) {
      // Clear any previous versions if we have no invalid records.
      fs.unlinkSync(invalidsFilePath);
    }
  } else {
    fs.writeFileSync(
      invalidsFilePath,
      JSON.stringify(invalid_jsons, null, 2) + '\n', // include newline to satisfy prettier
      'utf-8',
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
