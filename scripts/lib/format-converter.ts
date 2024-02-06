import Ajv from 'ajv';
import {
  COLLECTED_SCHEMA,
  CollectedStateIncentive,
} from '../../src/data/state_incentives';
import { LOCALIZABLE_STRING_SCHEMA } from '../../src/data/types/localizable-string';

const ajv = new Ajv({ allErrors: true, coerceTypes: 'array' });

// Could be generated from CollectedStateIncentive, filtering to array types.
const ARRAY_FIELDS = ['payment_methods', 'owner_status'];

const validate = ajv
  .addSchema(LOCALIZABLE_STRING_SCHEMA)
  .compile(COLLECTED_SCHEMA);

export function csvToJsonData(
  /* eslint-disable @typescript-eslint/no-explicit-any */
  rows: any,
  /* eslint-enable @typescript-eslint/no-explicit-any */
): [CollectedStateIncentive[], Record<string, string | object>[]] {
  type NestedKeyVal = { [index: string]: NestedKeyVal };

  const objs: Record<string, string | string[] | object>[] = [];
  for (const row of rows) {
    const data: NestedKeyVal = {};
    for (const columnName in row) {
      let val = row[columnName];
      if (val === '') continue;
      if (ARRAY_FIELDS.includes(columnName)) {
        // Assume comma-delimited array and split into components.
        val = val.split(',').map((s: string) => s.trim());
      }

      // Create nested object so that segmented.column.name
      // with value val becomes:
      // {
      //   segmented: {
      //     column: {
      //       name: val
      //     {
      //   }
      // }
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
  const valids: CollectedStateIncentive[] = [];
  const invalids: Record<string, string | object>[] = [];
  for (const json of objs) {
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
