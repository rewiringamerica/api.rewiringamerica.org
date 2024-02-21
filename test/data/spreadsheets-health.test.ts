import { parse } from 'csv-parse/sync';
import fetch from 'make-fetch-happen';
import { test } from 'tap';
import util from 'util';
import { FILES } from '../../scripts/incentive-spreadsheet-registry';
import { flatToNestedValidate } from '../../scripts/lib/format-converter';
import {
  FIELD_MAPPINGS,
  VALUE_MAPPINGS,
} from '../../scripts/lib/spreadsheet-mappings';
import { SpreadsheetStandardizer } from '../../scripts/lib/spreadsheet-standardizer';

// TODO: condition this on an environment variable that we set only
// in workflows where we want to run this test.
const skip: boolean = true;
test(
  'rows in registered spreadsheets meet our collected data schema or are opted out',
  { skip: skip ? 'spreadsheet health tests: skipped by default' : false },
  async tap => {
    for (const [state, file] of Object.entries(FILES)) {
      if (!file.runSpreadsheetHealthCheck) continue;
      try {
        const response = await fetch(file.sheetUrl);
        const csvContent = await response.text();
        const rows = parse(csvContent, {
          columns: true,
          from_line: file.headerRowNumber ?? 1,
        });

        const standardizer = new SpreadsheetStandardizer(
          FIELD_MAPPINGS,
          VALUE_MAPPINGS,
          false, // allow extra columns not in our schema
          null,
        );
        const standardized = rows.map(
          standardizer.standardize.bind(standardizer),
        );

        let [, invalids] = flatToNestedValidate(standardized);
        // Filter out unfilled rows at the end of the spreadsheet
        // where we prepopulated IDs but nothing else is filled in.
        invalids = invalids.filter(invalid => Object.keys(invalid).length > 2);
        if (invalids.length !== 0)
          console.error(
            `${state}` +
              util.inspect(
                invalids.map(invalid => [invalid.id, invalid.errors]),
                { depth: null },
              ),
          );
        tap.equal(
          invalids.length,
          0,
          `${state}'s spreadsheet does not match the collected data schema`,
        );
      } catch (e) {
        tap.fail(`Error while validating spreadsheet for state ${state}: ${e}`);
      }
    }
  },
);
