import Ajv from 'ajv';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import minimist from 'minimist';
import path from 'path';

import { LOW_INCOME_THRESHOLDS_BY_AUTHORITY } from '../src/data/low_income_thresholds';
import { STATE_SCHEMA, StateIncentive } from '../src/data/state_incentives';
import { LOCALIZABLE_STRING_SCHEMA } from '../src/data/types/localizable-string';
import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
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

  const standardizer = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    strict,
    lowIncome ? LOW_INCOME_THRESHOLDS_BY_AUTHORITY : null,
  );
  const invalids: Record<string, string | number | boolean | object>[] = [];
  const jsons: StateIncentive[] = [];
  rows.forEach((row: Record<string, string>) => {
    const standardized = standardizer.standardize(row);
    const refined = standardizer.refineCollectedData(state, standardized);
    if (!validate(refined)) {
      if (validate.errors !== undefined && validate.errors !== null) {
        refined.errors = validate.errors;
      }
      invalids.push(refined);
    } else {
      jsons.push(refined);
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
  if (invalids.length === 0) {
    if (fs.existsSync(invalidsFilePath)) {
      // Clear any previous versions if we have no invalid records.
      fs.unlinkSync(invalidsFilePath);
    }
  } else {
    fs.writeFileSync(
      invalidsFilePath,
      JSON.stringify(invalids, null, 2) + '\n', // include newline to satisfy prettier
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
