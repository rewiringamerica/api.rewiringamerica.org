import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en-us';
import { START_END_DATE_REGEX } from '../../src/lib/dates';
import { StringKeyed } from './format-converter';
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
const DATE_FIELDS = ['start_date', 'end_date'];

// Standardize column names or values in an incentive spreadsheet.
export class SpreadsheetStandardizer {
  private fieldMap: AliasMap;
  private valueMap: { [index: string]: AliasMap };
  private fieldAliasToCanonical: FlatAliasMap;
  private valueAliasToCanonical: { [index: string]: FlatAliasMap };
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
    // These first two maps are stored to translate from canonical column or
    // value to an alias, which is needed when writing JSON back to human-
    // readable version.
    this.fieldMap = fieldMap;
    this.valueMap = valueMap;
    // We reverse the input maps for easier runtime use when converting from
    // spreadsheet to JSON, since we need to go from aliases to canonical.
    this.fieldAliasToCanonical = reverseMap(fieldMap);
    this.valueAliasToCanonical = reverseValueMap(valueMap);
    this.strict = strict;
  }

  convertToCanonical(val: string, colName: string): string {
    const components: string[] = ARRAY_FIELDS.includes(colName)
      ? val.split(',').map(x => x.trim())
      : [val];

    return components
      .map((component: string) => {
        if (
          this.valueAliasToCanonical[colName] !== undefined &&
          this.valueAliasToCanonical[colName][cleanFieldName(component)] !==
            undefined
        ) {
          component =
            this.valueAliasToCanonical[colName][cleanFieldName(component)];
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
    if (DATE_FIELDS.includes(colName)) {
      val = normalizeDate(val);
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
      if (this.fieldAliasToCanonical[cleaned] === undefined && this.strict) {
        throw new Error(`Invalid column found: ${cleaned}; original: ${key}`);
      }

      const newCol = this.fieldAliasToCanonical[cleaned] || key;
      const val = this.convertToCanonical(input[key], newCol);

      output[newCol] = this.handleSpecialCases(val, newCol);
    }
    return output;
  }

  // This method expects already flattened input (i.e. no nested objects).
  // Arrays as values are allowed.
  convertToAliases(input: StringKeyed): StringKeyed {
    const output: StringKeyed = {};
    for (const [fieldName, fieldValue] of Object.entries(input)) {
      let outputFieldName = fieldName;
      if (this.fieldMap[fieldName] && this.fieldMap[fieldName][0]) {
        outputFieldName = this.fieldMap[fieldName][0];
      }
      let val = fieldValue;
      if (Array.isArray(val)) {
        // Special handling for arrays: try to rename each value.
        val = val.map(component => {
          if (this.valueMap[fieldName] && this.valueMap[fieldName][component]) {
            return this.valueMap[fieldName][component][0];
          }
          return component;
        });
      } else {
        if (this.valueMap[fieldName] && this.valueMap[fieldName][fieldValue]) {
          val = this.valueMap[fieldName][fieldValue][0];
        }
      }
      output[outputFieldName] = val;
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

/**
 * This is for start and end dates of incentives. If the input is already in
 * the required date format, it's returned as-is.
 *
 * Otherwise, we make an effort to parse a date from a few common formats.
 * Ideally, though, spreadsheets should use our incentive date format directly
 * (a superset of ISO 8601 dates).
 */
export function normalizeDate(input: string): string {
  if (START_END_DATE_REGEX.test(input)) {
    return input;
  }

  for (const formatter of ALLOWED_DATE_FORMATTERS) {
    try {
      const parsed = LocalDate.parse(input, formatter);
      return parsed.format(OUTPUT_DATE_FORMATTER);
    } catch (_) {
      // keep going
    }
  }

  // If the date was unparseable, return it as-is; it will fail JSON validation
  // later on.
  return input;
}

/** ISO 8601 date */
const OUTPUT_DATE_FORMATTER = DateTimeFormatter.ofPattern('yyyy-MM-dd');

/**
 * Parse these formats, which all exist in spreadsheets:
 *
 * - 9/30/2024
 * - Sep 30, 2024
 * - Sep 30 2024
 * - September 30, 2024
 * - September 30 2024
 */
const ALLOWED_DATE_FORMATTERS = [
  DateTimeFormatter.ofPattern('M/d/yyyy'),
  DateTimeFormatter.ofPattern('MMM d[,] yyyy').withLocale(Locale.ENGLISH),
  DateTimeFormatter.ofPattern('MMMM d[,] yyyy').withLocale(Locale.ENGLISH),
];
