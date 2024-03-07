import {
  AliasMap,
  FIELD_MAPPINGS,
  FlatAliasMap,
  VALUE_MAPPINGS,
} from './spreadsheet-mappings';

const ARRAY_FIELDS = ['payment_methods', 'owner_status'];
const DOLLAR_FIELDS = [
  'amount.number',
  'amount.minimum',
  'amount.maximum',
  'amount.representative',
];

// Standardize column names or values in an incentive spreadsheet.
export class SpreadsheetStandardizer {
  private fieldMap: FlatAliasMap;
  private valueMap: { [index: string]: FlatAliasMap };
  private strict: boolean;

  /**
   * @param fieldMap: a map from canonical column name to all of the aliases it might appear as in the Google spreadsheets
   * @param valueMap: a map from canonical value name to all of the aliases it might appear as in the Google spreadsheets
   * @param strict: whether to throw an error on aliases that aren't found
   */
  constructor(
    fieldMap: AliasMap = FIELD_MAPPINGS,
    valueMap: { [index: string]: AliasMap } = VALUE_MAPPINGS,
    strict: boolean = true,
  ) {
    // We reverse the input map for easier runtime use, since
    // we need to go from alias back to canonical name.
    this.fieldMap = reverseMap(fieldMap);
    this.valueMap = reverseValueMap(valueMap);
    this.strict = strict;
  }

  convertToCanonical(val: string, colName: string): string {
    const components: string[] = ARRAY_FIELDS.includes(colName)
      ? val.split(',').map(x => x.trim())
      : [val];

    return components
      .map((component: string) => {
        if (
          this.valueMap[colName] !== undefined &&
          this.valueMap[colName][cleanFieldName(component)] !== undefined
        ) {
          component = this.valueMap[colName][cleanFieldName(component)];
        }
        return component;
      })
      .join(',');
  }

  // Special case cleaning for bespoke fields
  handleSpecialCases(val: string, colName: string): string {
    if (DOLLAR_FIELDS.includes(colName)) {
      val = cleanDollars(val);
    }
    // We've allowed Both as a owner_status when it's really multiple
    // statuses, so hard to cover with our existing renaming schemes.
    if (colName === 'owner_status' && val === 'Both') {
      val = 'homeowner, renter';
    }
    return val;
  }

  // Convert a row with possible column aliases to a canonical column name.
  standardize(input: Record<string, string>): Record<string, string> {
    const output: Record<string, string> = {};
    for (const key in input) {
      const cleaned = cleanFieldName(key);
      if (this.fieldMap[cleaned] === undefined && this.strict) {
        throw new Error(`Invalid column found: ${cleaned}; original: ${key}`);
      }

      const newCol = this.fieldMap[cleaned] || key;
      const val = this.convertToCanonical(input[key], newCol);

      output[newCol] = this.handleSpecialCases(val, newCol);
    }
    return output;
  }
}

///////////
//  Helpers
///////////
const punctuationSeparators =
  /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]+/g;
const spaceSeparators = /\s+/g;

function cleanFieldName(field: string): string {
  return field
    .replace('\n', ' ')
    .replace('*', ' ')
    .replace(punctuationSeparators, ' ')
    .replace(spaceSeparators, ' ')
    .trim()
    .toLowerCase();
}

// Take an input map from string -> string[] and reverse it,
// which also implicitly flattens it. The input format is better
// for validation and manual data entry; the latter is better for
// runtime use.
function reverseMap(map: AliasMap): FlatAliasMap {
  const reversed: FlatAliasMap = {};
  for (const [fieldName, aliases] of Object.entries(map)) {
    for (const alias of aliases) {
      const cleaned = cleanFieldName(alias);
      if (cleaned in reversed) {
        throw new Error(
          `Duplicate column name found: ${cleaned}; original: ${alias}. This just means you've added a redundant value to the field mappings and this can probably be removed.`,
        );
      }
      reversed[cleaned] = fieldName;
    }
  }
  return reversed;
}

function reverseValueMap(map: { [index: string]: AliasMap }): {
  [index: string]: FlatAliasMap;
} {
  const output: {
    [index: string]: FlatAliasMap;
  } = {};
  for (const [key, val] of Object.entries(map)) {
    output[key] = reverseMap(val);
  }
  return output;
}

function cleanDollars(input: string): string {
  return input.replaceAll('$', '').replaceAll(',', '');
}
