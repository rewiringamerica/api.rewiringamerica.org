import { LowIncomeThresholdsMap } from '../../src/data/low_income_thresholds';
import {
  createAuthorityName,
  createProgramName,
} from './authority-and-program-updater';
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
  private lowIncomeThresholds: LowIncomeThresholdsMap | null;

  /**
   * @param fieldMap: a map from canonical column name to all of the aliases it might appear as in the Google spreadsheets
   * @param valueMap: a map from canonical value name to all of the aliases it might appear as in the Google spreadsheets
   * @param strict: whether to throw an error on aliases that aren't found
   * @param lowIncomeThresholds: state-segmented income thresholds. If empty, the script won't try to associate records with low-income programs.
   */
  constructor(
    fieldMap: AliasMap = FIELD_MAPPINGS,
    valueMap: { [index: string]: AliasMap } = VALUE_MAPPINGS,
    strict: boolean = true,
    lowIncomeThresholds: LowIncomeThresholdsMap | null = null,
  ) {
    // We reverse the input map for easier runtime use, since
    // we need to go from alias back to canonical name.
    this.fieldMap = reverseMap(fieldMap);
    this.valueMap = reverseValueMap(valueMap);
    this.strict = strict;
    this.lowIncomeThresholds = lowIncomeThresholds;
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

  // Convert a row with possible column aliases to a canonical column name.
  convertFieldNames(input: Record<string, string>): Record<string, string> {
    const output: Record<string, string> = {};
    for (const key in input) {
      const cleaned = cleanFieldName(key);
      if (this.fieldMap[cleaned] === undefined) {
        if (this.strict) {
          throw new Error(`Invalid column found: ${cleaned}; original: ${key}`);
        }
        output[key] = input[key];
        continue;
      }

      const newCol = this.fieldMap[cleaned];
      let val = this.convertToCanonical(input[key], newCol);

      // Special case cleaning fields – eventually this can be
      // more principled.
      if (DOLLAR_FIELDS.includes(newCol)) {
        val = cleanDollars(val);
      }
      // We've allowed Both as a owner_status when it's really multiple
      // statuses, so hard to cover with our existing renaming schemes.
      if (newCol === 'owner_status' && val === 'Both') {
        val = 'homeowner, renter';
      }

      output[newCol] = val;
    }
    return output;
  }

  // Try to convert a row with non-standard values to standard ones.
  // Failure means the row will still fail a2j schema validation later.
  recordToStandardValues(
    state: string,
    record: Record<string, string>,
  ): Record<string, string | number | object | boolean> {
    const authorityName = createAuthorityName(state, record.authority_name);
    const output: Record<string, string | number | object | boolean> = {
      id: record.id,
      authority_type: record.authority_type,
      authority: authorityName,
      type: record.payment_methods.split(',')[0],
      payment_methods: record.payment_methods.split(',').map(x => x.trim()),
      item: record.item,
      program: createProgramName(
        state,
        record.authority_name,
        record.program_title,
      ),
      amount: this.createAmount(record),
      owner_status: record.owner_status.split(',').map(x => x.trim()),
      short_description: {
        en: standardizeDescription(record['short_description.en']),
      },
    };
    if (
      record.program_start_raw !== undefined &&
      record.program_start_raw !== ''
    ) {
      output.start_date = +parseDateToYear(record.program_start_raw);
    }
    if (record.program_end_raw !== undefined && record.program_end_raw !== '') {
      output.end_date = +parseDateToYear(record.program_end_raw);
    }
    if (
      record.bonus_description !== undefined &&
      record.bonus_description !== ''
    ) {
      output.bonus_available = true;
    }
    if (this.lowIncomeThresholds && isPlausibleLowIncomeRow(record)) {
      const low_income_program = this.retrieveLowIncomeProgram(
        authorityName,
        state,
      );
      if (low_income_program) {
        output.low_income = authorityName;
      } else if (low_income_program === undefined) {
        // This is checked up front by the caller rather than
        // at the row level to avoid spamming error messages.
      } else {
        console.log(
          `Warning: no low-income thresholds found for ${record.id} despite references to income eligiblity in description or income restrictions columns. This either means: 1) manually set this field in the JSON to 'default' to use a state's default thresholds (must be defined), or 2) you need to define program-specific thresholds for it, or 3) it's not actually a low-income row and no action is necessary.`,
        );
      }
    }

    return output;
  }

  retrieveLowIncomeProgram(authority: string, state: string) {
    if (this.lowIncomeThresholds![state] === undefined) {
      return undefined;
    }
    return authority in this.lowIncomeThresholds![state];
  }

  createAmount(input: Record<string, string>): Record<string, number | string> {
    const amount: Record<string, number | string> = {
      type: input['amount.type'],
      number: +cleanDollars(input['amount.number']),
    };
    if (
      input['amount.representative'] !== undefined &&
      input['amount.representative'] !== ''
    ) {
      amount.representative = +cleanDollars(input['amount.representative']);
    }
    if (
      input['amount.minimum'] !== undefined &&
      input['amount.minimum'] !== ''
    ) {
      amount.minimum = +cleanDollars(input['amount.minimum']);
    }
    if (
      input['amount.maximum'] !== undefined &&
      input['amount.maximum'] !== ''
    ) {
      amount.maximum = +cleanDollars(input['amount.maximum']);
    }
    if (input['amount.unit'] !== undefined && input['amount.unit'] !== '') {
      amount.unit = input['amount.unit'];
    }
    return amount;
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

function standardizeDescription(desc: string): string {
  desc = desc.replaceAll('\n', ' ').trim();
  if (!desc.endsWith('.')) {
    desc = desc + '.';
  }
  return desc;
}

function isPlausibleLowIncomeRow(record: Record<string, string>) {
  if (
    record.income_restrictions !== undefined &&
    record.income_restrictions !== ''
  ) {
    return true;
  }
  if (
    record.short_description !== undefined &&
    record.short_description.toLowerCase().includes('income')
  ) {
    return true;
  }
  return false;
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

function parseDateToYear(input: string): string {
  if (input.length === 4) return input;
  let sep;
  if (input.indexOf('/') !== -1) {
    sep = '/';
  } else if (input.indexOf('-') !== -1) {
    sep = '-';
  } else {
    return input;
  }

  if (input.indexOf(sep) === 4) return input.substring(0, 4);
  if (input.length - input.lastIndexOf(sep) === 5) {
    return input.substring(input.lastIndexOf(sep) + 1, input.length);
  }
  return input;
}

function cleanDollars(input: string): string {
  return input.replaceAll('$', '').replaceAll(',', '');
}
