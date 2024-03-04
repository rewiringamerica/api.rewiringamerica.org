import { parse } from 'csv-parse/sync';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import minimist from 'minimist';

import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
import { FIELD_MAPPINGS, VALUE_MAPPINGS } from './lib/spreadsheet-mappings';
import { SpreadsheetStandardizer } from './lib/spreadsheet-standardizer';
import { Incentive, LocalizableString } from './translation-types';

async function edit(file: IncentiveFile, write: boolean) {
  const response = await fetch(file.sheetUrl);
  const csvContent = await response.text();
  const rows = parse(csvContent, {
    columns: true,
    from_line: file.headerRowNumber ?? 1,
  });

  const standardizer = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    /* strict */ false,
    /* low income thresholds */ null,
  );
  const standardized = rows.map(standardizer.standardize.bind(standardizer));

  const descriptionsById = new Map<string, LocalizableString>();

  standardized.forEach((row: Record<string, string>) => {
    const id = row['id'];
    if (!descriptionsById.has(id)) {
      descriptionsById.set(id, { en: '' });
    }

    descriptionsById.get(id)!.en = row['short_description.en'].trim();
    if (file.esHeader) {
      descriptionsById.get(id)!.es = row['short_description.es'].trim();
    }
  });

  const incentives: Incentive[] = JSON.parse(
    fs.readFileSync(file.filepath, 'utf-8'),
  );

  incentives.forEach(incentive => {
    if (descriptionsById.has(incentive.id)) {
      const spreadsheetDescription = descriptionsById.get(incentive.id)!;
      if (spreadsheetDescription.es === '') {
        // Don't include blank Spanish strings
        delete spreadsheetDescription.es;
      }

      let edits = false;
      if (incentive.short_description.en !== spreadsheetDescription.en) {
        console.log(
          `✏️ ${incentive.id}: "${incentive.short_description.en}" --> "${spreadsheetDescription.en}"`,
        );
        incentive.short_description.en = spreadsheetDescription.en;
        edits = true;
      }
      if (incentive.short_description.es !== spreadsheetDescription.es) {
        console.log(
          `✏️ ${incentive.id}: "${incentive.short_description.es}" --> "${spreadsheetDescription.es}"`,
        );
        incentive.short_description.es = spreadsheetDescription.es;
        edits = true;
      }
      if (!edits) {
        console.log(`✔ ${incentive.id}: no edits needed.`);
      }
    } else {
      console.log(`✘ ${incentive.id}: not in spreadsheet, consider removing?`);
    }
  });

  // if requested, write that file back out:
  if (write) {
    fs.writeFileSync(
      file.filepath,
      JSON.stringify(incentives, null, 2) + '\n', // include newline to satisfy prettier
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
    await edit(FILES[fileIdent], args.write);
  });
})();
