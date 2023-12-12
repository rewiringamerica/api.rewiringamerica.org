import { parse } from 'csv-parse/sync';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import minimist from 'minimist';

type LocalizableString = {
  en: string;
  es?: string;
};

type Incentive = {
  id: string;
  short_description: LocalizableString;
};

type IncentiveFile = {
  filepath: string;
  sheetUrl: string;
  idHeader: string;
  enHeader: string;
  esHeader?: string;
  headerRowNumber?: number;
};

const FILES: { [ident: string]: IncentiveFile } = {
  IRA: {
    filepath: 'data/ira_incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTt1X34nGvUZu8Z71S-P9voD_zL6zvNapDJcL-RbH8SohQYAKOMN7ZeAA4Ti130PFAjei4uHImyV6dg/pub?gid=0&single=true&output=csv',
    idHeader: 'ID',
    enHeader: 'Short Description (150 characters max)',
    esHeader: 'Short Description-Spanish',
  },
  RI: {
    filepath: 'data/RI/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSoBQdIvYNb9fRkFggllmLZmz9nwL6SYxM7cdsiTPDU90C0HXtFh2r1qlYKdfbTzzxiPZ0o4NpOva__/pub?gid=30198531&single=true&output=csv',
    headerRowNumber: 2,
    idHeader: 'ID',
    enHeader: 'Program Description (style guide)',
    esHeader: 'Program Description (Spanish)',
  },
};

async function edit(file: IncentiveFile, write: boolean) {
  const response = await fetch(file.sheetUrl);
  const csvContent = await response.text();
  const rows = parse(csvContent, {
    columns: true,
    from_line: file.headerRowNumber ?? 1,
  });

  const descriptionsById = new Map<string, LocalizableString>();

  rows.forEach((row: Record<string, string>) => {
    const id = row[file.idHeader];
    if (!descriptionsById.has(id)) {
      descriptionsById.set(id, { en: '' });
    }

    descriptionsById.get(id)!.en = row[file.enHeader].trim();
    if (file.esHeader) {
      descriptionsById.get(id)!.es = row[file.esHeader].trim();
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
