/*
import { parse } from 'csv-parse/sync';
import _ from 'lodash';
import { argv } from 'process';
import { FILES } from './incentive-spreadsheet-registry';
import { normalizeDate } from './lib/data-refiner';

(async () => {
  const promises = argv.slice(2).map(filecode =>
    (async () => {
      const file = FILES[filecode];
      const response = await fetch(file.sheetUrl);
      const csvContent = await response.text();
      const rows = parse(csvContent, {
        columns: true,
        from_line: file.headerRowNumber ?? 1,
      });

      const output: [string, string][] = [];

      for (const row of rows) {
        if (row['Program Start']) {
          output.push([row['ID'], row['Program Start']]);
        }
        if (row['Program Start (mm/dd/yyyy)']) {
          output.push([row['ID'], row['Program Start (mm/dd/yyyy)']]);
        }
        if (row['Program Start']) {
          output.push([row['ID'], row['Program End']]);
        }
        if (row['Program End (mm/dd/yyyy)']) {
          output.push([row['ID'], row['Program End (mm/dd/yyyy)']]);
        }
      }

      return output;
    })(),
  );

  const results = _.flatten(await Promise.all(promises));

  results.forEach(([id, date]) => {
    if (date !== '') {
      const normalized = normalizeDate(date);
      if (normalized === date) {
        console.log(id, date, normalized);
      }
    }
  });
})();
*/
