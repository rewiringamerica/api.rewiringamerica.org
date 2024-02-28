import Ajv from 'ajv';
import {
  COLLECTED_DATA_SCHEMA,
  CollectedIncentive,
} from '../../src/data/state_incentives';
import { LOCALIZABLE_STRING_SCHEMA } from '../../src/data/types/localizable-string';

const ajv = new Ajv({ allErrors: true, coerceTypes: 'array' });

// TODO: consolidate with spreadsheet-standardizer.ts constant
// and generate both directly from CollectedIncentive schema.
const ARRAY_FIELDS = ['data_urls', 'payment_methods', 'owner_status'];
const BOOL_FIELDS = ['omit_from_api'];

const validate = ajv
  .addSchema(LOCALIZABLE_STRING_SCHEMA)
  .compile(COLLECTED_DATA_SCHEMA);

type NestedKeyVal = { [index: string]: NestedKeyVal };
export type CollectedIncentivesWithErrors = Partial<CollectedIncentive> & {
  errors: object[];
};

/**
 * Call this function to perform validation on the collected records.
 * To convert without validation, call flatToNested instead.
 * @param rows the result of csv-parse.
 * @param arrayCols any column names that should be treated as comma-delimited arrays
 * @returns a tuple of valid and invalid records.
 */
export function flatToNestedValidate(
  /* eslint-disable @typescript-eslint/no-explicit-any */
  rows: any[],
  /* eslint-enable @typescript-eslint/no-explicit-any */
  arrayCols: string[] = ARRAY_FIELDS,
  boolCols: string[] = BOOL_FIELDS,
): [CollectedIncentive[], CollectedIncentivesWithErrors[]] {
  const valids: CollectedIncentive[] = [];
  const invalids: CollectedIncentivesWithErrors[] = [];
  for (const json of flatToNested(rows, arrayCols, boolCols)) {
    if (!validate(json)) {
      const invalid = json as CollectedIncentivesWithErrors;
      if (validate.errors !== undefined && validate.errors !== null) {
        invalid.errors = validate.errors;
      }
      invalids.push(invalid);
    } else {
      valids.push(json);
    }
  }
  return [valids, invalids];
}

/**
 * Converts records from flat to nested objects without validation.
 * The input should be the result of csv-parse.
 * Nesting is possible using dot-syntax in the column name.
 *
 * segmented.column.name with value val becomes:
 * {
 *   segmented: {
 *     column: {
 *       name: val
 *     {
 *   }
 * }
 * @param rows the result of csv-parse.
 * @param arrayCols any column names that should be treated as comma-delimited arrays
 */
export function flatToNested(
  // lint disable required for the output of csv-parse.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  rows: any[],
  /* eslint-enable @typescript-eslint/no-explicit-any */
  arrayCols: string[] = [],
  boolCols: string[] = [],
): Partial<CollectedIncentive>[] {
  const objs: Record<string, string | string[] | object>[] = [];
  for (const row of rows) {
    const output: NestedKeyVal = {};
    for (const columnName in row) {
      let val = row[columnName];
      if (val === '') continue;
      if (arrayCols.includes(columnName)) {
        // Assume comma-delimited array and split into components.
        val = val.split(',').map((s: string) => s.trim());
      }
      if (boolCols.includes(columnName)) {
        // Minimal-effort conversion of booleans from string.
        val = coerceToBoolean(val);
      }

      const chunks = columnName.split('.');
      // dest is basically a pointer to a particular object or subobject in
      // the output structure. It starts at the root output for each key but
      // advances into sub-objects to allow nesting.
      let dest = output;
      if (chunks.length === 1) {
        dest[chunks[0]] = val;
      } else {
        for (const chunk of chunks.slice(0, -1)) {
          if (!(chunk in dest)) {
            const subobj: NestedKeyVal = {};
            dest[chunk] = subobj;
          }
          dest = dest[chunk];
        }
        dest[chunks.at(-1)!] = val;
      }
    }
    objs.push(output);
  }
  return objs;
}

// This function is only necessary because ajv cannot convert the string values
// 'TRUE' or 'FALSE' to boolean, which is how Google Sheets/csv renders boolean
// values. Any other value will (appropriately) cause the schema validation to
// fail, so we don't deal with errors here.
function coerceToBoolean(input: string): boolean | string {
  if (input.toLowerCase() === 'true') return true;
  if (input.toLowerCase() === 'false') return false;
  return input;
}
