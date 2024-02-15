import Ajv from 'ajv';
import {
  COLLECTED_DATA_SCHEMA,
  CollectedFields,
} from '../../src/data/state_incentives';
import { LOCALIZABLE_STRING_SCHEMA } from '../../src/data/types/localizable-string';

const ajv = new Ajv({ allErrors: true, coerceTypes: 'array' });

// Could be generated from CollectedFields, filtering to array types.
const ARRAY_FIELDS = ['data_urls', 'payment_methods', 'owner_status'];

const validate = ajv
  .addSchema(LOCALIZABLE_STRING_SCHEMA)
  .compile(COLLECTED_DATA_SCHEMA);

// Call this function to perform validation on the json.
// This returns a tuple of valid and invalid records.
// To convert without validation, call csvToJson directly.
export function csvToJsonValidate(
  /* eslint-disable @typescript-eslint/no-explicit-any */
  rows: any[],
  /* eslint-enable @typescript-eslint/no-explicit-any */
  arrayCols: string[] = ARRAY_FIELDS,
): [CollectedFields[], Record<string, string | object>[]] {
  const valids: CollectedFields[] = [];
  const invalids: Record<string, string | object>[] = [];
  for (const json of csvToJson(rows, arrayCols)) {
    if (!validate(json)) {
      if (validate.errors !== undefined && validate.errors !== null) {
        json.errors = validate.errors;
      }
      invalids.push(json);
    } else {
      valids.push(json);
    }
  }
  return [valids, invalids];
}

// Converts records from csv to json format without validation.
// Nesting is possible using dot-syntax in the column name.
//
// segmented.column.name with value val becomes:
// {
//   segmented: {
//     column: {
//       name: val
//     {
//   }
// }
export function csvToJson(
  // lint disable required for the output of csv-parse.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  rows: any[],
  /* eslint-enable @typescript-eslint/no-explicit-any */
  arrayCols: string[] = ARRAY_FIELDS,
): Record<string, string | string[] | object>[] {
  type NestedKeyVal = { [index: string]: NestedKeyVal };

  const objs: Record<string, string | string[] | object>[] = [];
  for (const row of rows) {
    const data: NestedKeyVal = {};
    for (const columnName in row) {
      let val = row[columnName];
      if (val === '') continue;
      if (arrayCols.includes(columnName)) {
        // Assume comma-delimited array and split into components.
        val = val.split(',').map((s: string) => s.trim());
      }

      const chunks = columnName.split('.');
      let dest = data;
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
    objs.push(data);
  }
  return objs;
}
