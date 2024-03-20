import Ajv from 'ajv';
import { sheets_v4 } from 'googleapis';
import util from 'util';
import {
  COLLECTED_DATA_SCHEMA,
  CollectedIncentive,
} from '../../src/data/state_incentives';
import { LOCALIZABLE_STRING_SCHEMA } from '../../src/data/types/localizable-string';
import {
  AliasMap,
  FIELD_MAPPINGS,
  VALUE_MAPPINGS,
} from './spreadsheet-mappings';
import { SpreadsheetStandardizer } from './spreadsheet-standardizer';

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

function colToLetter(column: number) {
  let temp,
    letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

// This method only retrieves hyperlinks that are not already represented in
// the cell's text. If a URL appears in the text, it will be ignored.
function retrieveCellHyperLinks(cell: sheets_v4.Schema$CellData): string[] {
  const hyperlinks = new Set<string>();
  if (cell.textFormatRuns) {
    for (const run of cell.textFormatRuns) {
      const uri = run.format?.link?.uri;
      if (uri && !cell.formattedValue!.includes(uri)) {
        hyperlinks.add(uri);
      }
    }
  }
  if (cell.hyperlink && !cell.formattedValue!.includes(cell.hyperlink)) {
    hyperlinks.add(cell.hyperlink);
  }
  return Array.from(hyperlinks);
}

export enum LinkMode {
  Convert,
  Drop,
  Error,
}

/**
 * Call this function to convert a Google Sheet to a csv-like flat format.
 * @param incentives the Google sheet, which can be retrieved with the Sheets API.
 * @param convertLinks if true, hyperlinks will be inserted into the cell text so they are not lost during conversion. If false, will error if there are hyperlinks.
 * @param headerRow the 1-indexed row where the header data is (same row number as you see in Google Sheets).
 * @returns a list of records suitable for the rest of the spreadsheet-to-json process.
 */
export function googleSheetToFlatData(
  incentives: sheets_v4.Schema$Sheet,
  convertLinks: LinkMode,
  headerRow: number,
): Record<string, string>[] {
  if (!incentives.data) throw new Error('No grid data in GoogleSheet');

  const cellAddressToHyperlinks: { [index: string]: string[] } = {};
  const records: Record<string, string>[] = [];
  const headers: string[] = [];
  incentives.data[0].rowData!.forEach((row, rIndex) => {
    if (rIndex < headerRow - 1) return; // skip pre-header rows
    if (rIndex === headerRow - 1) {
      if (!row.values) {
        throw new Error(
          'No values found in header row, probably due to incorrect header row provided',
        );
      }
      row.values.forEach(cell => {
        headers.push(cell.formattedValue!);
      });
      return;
    }
    const record: Record<string, string> = {};
    if (row.values) {
      row.values.forEach((cell, cIndex) => {
        let cellValue = cell.formattedValue ?? '';
        const links = retrieveCellHyperLinks(cell);
        if (links.length > 0) {
          if (convertLinks === LinkMode.Convert) {
            cellValue = cellValue + ` (link(s): ${links.join(', ')})`;
          } else {
            // Store to possibly log as error with all hyperlinks.
            cellAddressToHyperlinks[`${colToLetter(cIndex + 1)}${rIndex + 1}`] =
              links;
          }
        }
        record[headers[cIndex]] = cellValue;
      });
      // This targets spreadsheet rows where we only have the ID and nothing
      // else is populated. We have this in some spreadsheets for convenience.
      if (Object.keys(record).length < 2) return;
      records.push(record);
    }
  });
  if (
    convertLinks === LinkMode.Error &&
    Object.keys(cellAddressToHyperlinks).length > 0
  ) {
    throw new Error(
      `Hyperlinks found in spreadsheet, which don't convert well to JSON. Either: 1) pass LinkMode.Convert, which will change the cell text to contain the hyperlink target, 2) pass LinkMode.Drop, which will suppress this error but lose the hyperlink targets, or 3) go to the source spreadsheet and remove the hyperlinks. Hyperlinks found: ${util.inspect(
        cellAddressToHyperlinks,
        {
          depth: null,
        },
      )}`,
    );
  }
  return records;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StringKeyed = { [index: string]: any };

export function nestedToFlat(input: StringKeyed): StringKeyed {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: { [index: string]: any } = {};
  for (const [fieldName, field] of Object.entries(input)) {
    if (field === undefined) continue;
    if (Array.isArray(field)) {
      output[fieldName] = field.join(', ');
    } else if (typeof field === 'object' && !Array.isArray(field)) {
      for (const [nestedKey, nestedVal] of Object.entries(
        nestedToFlat(field),
      )) {
        output[`${fieldName}.${nestedKey}`] = nestedVal;
      }
    } else {
      output[fieldName] = field;
    }
  }
  return output;
}

export function collectedIncentiveToGoogleSheet(
  incentives: CollectedIncentive[],
  fieldMappings: AliasMap,
): sheets_v4.Schema$Sheet {
  const standardizer = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    false,
  );

  const headers = Object.values(fieldMappings).map(mapping => mapping[0]);
  let rowData: sheets_v4.Schema$RowData[] = [];
  incentives.forEach(incentive => {
    const flattened = nestedToFlat(incentive);
    const aliased = standardizer.convertToAliases(flattened);
    // First ensure we have a header column for every value, including those
    // not in our schema.
    for (const key in aliased) {
      if (!headers.includes(key)) {
        console.log(`Missing key: ${key}`);
        headers.push(key);
      }
    }

    // Then populate a row, including "blanks" for keys we don't have.
    const rowValues: sheets_v4.Schema$CellData[] = [];
    for (const col of headers) {
      if (col in aliased) {
        let valToWrite: sheets_v4.Schema$ExtendedValue = {};
        if (typeof aliased[col] === 'string') {
          valToWrite = { stringValue: aliased[col] };
        } else if (typeof aliased[col] === 'boolean') {
          valToWrite = { boolValue: aliased[col] };
        } else if (typeof aliased[col] === 'number') {
          valToWrite = { numberValue: +aliased[col] };
        } else {
          console.warn(
            `Unexpected value type: ${col}: ${aliased[col]}. Writing as string.`,
          );
          valToWrite = { stringValue: aliased[col] };
        }
        rowValues.push({
          userEnteredValue: valToWrite,
        });
      } else {
        rowValues.push({});
      }
    }
    rowData.push({ values: rowValues });
  });
  // Prepend the headers.
  const headersRow: sheets_v4.Schema$CellData[] = [];
  for (const col of headers) {
    headersRow.push({
      userEnteredValue: { stringValue: col },
    });
  }
  rowData = [{ values: headersRow }, ...rowData];
  return {
    data: [
      {
        rowData,
      },
    ],
  };
}
