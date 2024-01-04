import Ajv from 'ajv';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import minimist from 'minimist';

import { STATE_SCHEMA, StateIncentive } from '../src/data/state_incentives';
import { LOCALIZABLE_STRING_SCHEMA } from '../src/data/types/localizable-string';
import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
import { ColumnConverter } from './lib/column-converter';
import { FIELD_MAPPINGS } from './lib/spreadsheet-mappings';

const ajv = new Ajv({ allErrors: true });

const validate = ajv.addSchema(LOCALIZABLE_STRING_SCHEMA).compile(STATE_SCHEMA);

async function convertToJson(
  state: string,
  file: IncentiveFile,
  write: boolean,
) {
  const response = await fetch(file.sheetUrl);
  const csvContent = await response.text();
  const rows = parse(csvContent, {
    columns: true,
    from_line: file.headerRowNumber ?? 1,
  });

  const converter = new ColumnConverter(FIELD_MAPPINGS, true);
  const invalids: Record<string, string | number | boolean | object>[] = [];
  const jsons: StateIncentive[] = [];
  rows.forEach((row: Record<string, string>) => {
    const renamed = converter.convertFieldNames(row);
    const standardized = converter.recordToStandardValues(state, renamed);
    if (!validate(standardized)) {
      if (validate.errors !== undefined && validate.errors !== null) {
        standardized.errors = validate.errors;
      }
      invalids.push(standardized);
    } else {
      jsons.push(standardized);
    }
  });

  if (write) {
    fs.writeFileSync(
      file.filepath,
      JSON.stringify(jsons, null, 2) + '\n', // include newline to satisfy prettier
      'utf-8',
    );
    fs.writeFileSync(
      file.filepath.replace('.json', '_invalid.json'),
      JSON.stringify(invalids, null, 2) + '\n', // include newline to satisfy prettier
      'utf-8',
    );
  }
}

(async function () {
  const args = minimist(process.argv.slice(2), { boolean: ['write'] });

  const bad = args._.filter(f => !(f in FILES));
  if (bad.length) {
    console.error(
      `${bad.join(', ')} not valid (choices: ${Object.keys(FILES).join(', ')})`,
    );
    process.exit(1);
  }

  args._.forEach(async fileIdent => {
    await convertToJson(fileIdent, FILES[fileIdent], args.write);
  });
})();
