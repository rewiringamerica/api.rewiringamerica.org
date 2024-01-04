/* 
See README for usage.

This script covers:
data/authorities.json
data/programs.ts
src/data/programs.ts

Though you may need to edit these files to put states in alphabetical order.

Follow-up script to create JSON:
data/<state_id>/incentives.json (run incentive-spreadsheet-to-json.ts)
Everything else you should create manually by following a recent CL example.
Ex: https://github.com/rewiringamerica/api.rewiringamerica.org/pull/209/files
*/
import { parse } from 'csv-parse/sync';
import minimist from 'minimist';
import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
import { ColumnConverter } from './lib/column-converter';
import { AuthorityAndProgramManager } from './lib/programs_updater';
import { FIELD_MAPPINGS } from './lib/spreadsheet-mappings';

async function generate(state: string, file: IncentiveFile) {
  const response = await fetch(file.sheetUrl);
  const csvContent = await response.text();
  const rows = parse(csvContent, {
    columns: true,
    from_line: file.headerRowNumber ?? 1,
  });

  const converter = new ColumnConverter(FIELD_MAPPINGS, true);

  const authorityProgramManager = new AuthorityAndProgramManager(state);
  rows.forEach((row: Record<string, string>) => {
    const renamed = converter.convertFieldNames(row);
    authorityProgramManager.addRow(renamed);
  });

  authorityProgramManager.updateProgramsTs();
  authorityProgramManager.updateProgramJson();
  authorityProgramManager.updateAuthoritiesJson();
}

(async function () {
  const args = minimist(process.argv.slice(2));

  const bad = args._.filter(f => !(f in FILES));
  if (bad.length) {
    console.error(
      `${bad.join(', ')} not valid (choices: ${Object.keys(FILES).join(', ')})`,
    );
    process.exit(1);
  }

  args._.forEach(async fileIdent => {
    await generate(fileIdent, FILES[fileIdent]);
  });
})();
