import { parse } from 'csv-parse/sync';
import fetch from 'make-fetch-happen';
import { test } from 'tap';
import util from 'util';
import { FILES } from './incentive-spreadsheet-registry';
import { spreadsheetToJson } from './incentive-spreadsheet-to-json';

test('rows in registered spreadsheets meet our collected data schema or are opted out', async tap => {
  for (const [state, file] of Object.entries(FILES)) {
    if (!file.runSpreadsheetHealthCheck) continue;
    try {
      const response = await fetch(file.sheetUrl);
      const csvContent = await response.text();
      const rows = parse(csvContent, {
        columns: true,
        from_line: file.headerRowNumber ?? 1,
      });

      const output = await spreadsheetToJson(state, rows, false, null);
      if (output.invalidCollectedIncentives.length > 0) {
        console.error(
          `${state}` +
            util.inspect(
              output.invalidCollectedIncentives.map(invalid => [
                invalid.id,
                invalid.errors,
              ]),
              { depth: null },
            ),
        );
      }
      tap.equal(
        output.invalidCollectedIncentives.length,
        0,
        `${state}'s spreadsheet does not match the collected data schema`,
      );
    } catch (e) {
      tap.fail(`Error while validating spreadsheet for state ${state}: ${e}`);
    }
  }
});