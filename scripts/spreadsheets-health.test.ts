import { parse } from 'csv-parse/sync';
import fs from 'fs';
import _ from 'lodash';
import fetch from 'make-fetch-happen';
import { test } from 'tap';
import {
  PASS_THROUGH_FIELDS,
  StateIncentive,
} from '../src/data/state_incentives';
import { FILES } from './incentive-spreadsheet-registry';
import { spreadsheetToJson } from './incentive-spreadsheet-to-json';

// Avoid these kind of exceptions, but can be helpful when spreadsheet-based
// work is mid-progress.
const IGNORE_ES_TRANSLATIONS : string[] = [];

function filterToKeyFields(
  incentive: StateIncentive,
  state: string,
): Partial<StateIncentive> {
  const subset = _.pick(incentive, PASS_THROUGH_FIELDS);
  if (IGNORE_ES_TRANSLATIONS.includes(state)) {
    delete subset.short_description.es;
  }
  return subset;
}

test('registered spreadsheets are in sync with checked-in JSON files', async tap => {
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
      const invalidCollectedPath = file.filepath.replace(
        '.json',
        '_invalid_collected.json',
      );
      const invalidStatePath = file.filepath.replace(
        '.json',
        '_invalid_state.json',
      );
      const previousCollectedExceptions: string = fs.existsSync(
        invalidCollectedPath,
      )
        ? JSON.parse(fs.readFileSync(invalidCollectedPath, 'utf-8'))
        : [];
      const previousStateExceptions: string = fs.existsSync(invalidStatePath)
        ? JSON.parse(fs.readFileSync(invalidStatePath, 'utf-8'))
        : [];

      // We expect full equality of any invalid records, in contrast to valid
      // records where we only assert agreement for some fields.
      tap.matchOnlyStrict(
        output.invalidCollectedIncentives,
        previousCollectedExceptions,
        `${state} spreadsheet out of sync with invalid collected JSON files. See scripts/README.md for advice on how to resolve`,
      );
      tap.matchOnlyStrict(
        output.invalidStateIncentives,
        previousStateExceptions,
        `${state} spreadsheet out of sync with invalid state JSON files. See scripts/README.md for advice on how to resolve`,
      );

      // We have more lenience for valid JSON records, since there are still
      // parts of the process that require manual steps. Eventually, we want
      // the process to require strict equality here as well. For now, we
      // assert that all pass-through fields are exactly the same, which
      // should still keep things roughly in sync.
      const goldenValidStateIncentives: StateIncentive[] = fs.existsSync(
        file.filepath,
      )
        ? JSON.parse(fs.readFileSync(file.filepath, 'utf-8'))
        : [];

      tap.matchOnlyStrict(
        goldenValidStateIncentives.map(incentive =>
          filterToKeyFields(incentive, state),
        ),
        output.validStateIncentives.map(incentive =>
          filterToKeyFields(incentive, state),
        ),
        `${state} spreadsheet out of sync with valid JSON files. See scripts/README.md for advice on how to resolve`,
      );
    } catch (e) {
      tap.fail(`Error while validating spreadsheet for state ${state}: ${e}`);
    }
  }
});
