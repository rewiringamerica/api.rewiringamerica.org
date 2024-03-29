import { parse } from 'csv-parse/sync';
import minimist from 'minimist';
import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
import { AuthorityAndProgramUpdater } from './lib/authority-and-program-updater';
import { FIELD_MAPPINGS, VALUE_MAPPINGS } from './lib/spreadsheet-mappings';
import { SpreadsheetStandardizer } from './lib/spreadsheet-standardizer';

async function generate(state: string, file: IncentiveFile) {
  const response = await fetch(file.sheetUrl);
  const csvContent = await response.text();
  const rows = parse(csvContent, {
    columns: true,
    from_line: file.headerRowNumber ?? 1,
  });

  // strict_mode can be false since it's more error-tolerant, and we'll fail
  // if we don't have the right columns anyway.
  const strict_mode = false;
  const standardizer = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    strict_mode,
  );

  const authorityProgramManager = new AuthorityAndProgramUpdater(state);
  rows.forEach((row: Record<string, string>) => {
    const standardized = standardizer.standardize(row);
    authorityProgramManager.addRow(standardized);
  });

  authorityProgramManager.updatePrograms();
  authorityProgramManager.updateAuthoritiesJson();
  authorityProgramManager.updateGeoGroupsJson();
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
