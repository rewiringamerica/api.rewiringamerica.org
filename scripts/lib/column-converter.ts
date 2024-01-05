import { AuthorityType } from '../../src/data/authorities';
import { AmountType, AmountUnit } from '../../src/data/types/amount';
import { PaymentMethod } from '../../src/data/types/incentive-types';
import { ITEMS_SCHEMA, Item } from '../../src/data/types/items';
import { OwnerStatus } from '../../src/data/types/owner-status';
import { createAuthorityName, createProgramName } from './programs_updater';
import { FIELD_MAPPINGS, VALUE_MAPPINGS } from './spreadsheet-mappings';

const wordSeparators =
  /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]+/;

function cleanFieldName(field: string): string {
  return field
    .replace('\n', '')
    .replace('*', '')
    .replace(wordSeparators, '')
    .trim()
    .toLowerCase();
}

function reverseMap(map: { [index: string]: string[] }): {
  [index: string]: string;
} {
  const reversed: { [index: string]: string } = {};
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

const strict = false;

function coerceToStandardValue(
  input: string,
  allowed: Set<string>,
  mapping: Record<string, string> = {},
): string {
  if (input === undefined) {
    if (strict) {
      throw new Error('Undefined input');
    } else {
      return 'TODO: undefined';
    }
  }
  let copy = input.replaceAll('\n', '').trim();
  if (copy in mapping) {
    copy = mapping[copy];
  }
  const snakeCase = copy.toLowerCase().replaceAll(' ', '_');
  if (allowed.has(snakeCase)) {
    return snakeCase;
  }
  if (strict) {
    throw new Error(
      `Could not coerce ${input} (mapped to ${copy}) to possible value ${allowed}`,
    );
  } else {
    return `TODO: ${input}`;
  }
}

function findPaymentMethods(input: string): string[] {
  if (input === undefined || input === '') {
    return [];
  }
  const methods: string[] = [];
  for (const method of input.split(',')) {
    methods.push(
      coerceToStandardValue(
        method,
        getEnumValues(Object.values(PaymentMethod)),
        VALUE_MAPPINGS.payment_methods,
      ),
    );
  }
  return methods;
}

function findOwnerStatus(input: string): OwnerStatus[] {
  if (input === undefined || input === '') {
    return [];
  }
  if (input.toLowerCase() === 'both' || input.includes(',')) {
    return [OwnerStatus.Homeowner, OwnerStatus.Renter];
  } else if (input.toLowerCase() === 'renter') {
    return [OwnerStatus.Renter];
  } else if (input.toLowerCase() === 'homeowner') {
    return [OwnerStatus.Homeowner];
  }
  return [];
}

type enumsOfInterest = (
  | AmountType
  | AmountUnit
  | AuthorityType
  | Item
  | PaymentMethod
)[];

function getEnumValues(enums: enumsOfInterest): Set<string> {
  return new Set(enums.filter(value => typeof value === 'string'));
}

function createAmount(
  input: Record<string, string>,
): Record<string, number | string> {
  const amount: Record<string, number | string> = {
    type: coerceToStandardValue(
      input.amount_type,
      getEnumValues(Object.values(AmountType)),
      VALUE_MAPPINGS.amount_type,
    ),
    number: +cleanDollars(input.number),
  };
  if (
    input.amount_representative !== undefined &&
    input.amount_representative !== ''
  ) {
    amount.representative = +cleanDollars(input.amount_representative);
  }
  if (input.amount_minimum !== undefined && input.amount_minimum !== '') {
    amount.minimum = +cleanDollars(input.amount_minimum);
  }
  if (input.amount_maximum !== undefined && input.amount_maximum !== '') {
    amount.maximum = +cleanDollars(input.amount_maximum);
  }
  if (input.unit !== undefined && input.unit !== '') {
    amount.unit = coerceToStandardValue(
      input.unit,
      getEnumValues(Object.values(AmountUnit)),
      VALUE_MAPPINGS.amount_unit,
    );
  }
  return amount;
}

export class ColumnConverter {
  private fieldMap: { [index: string]: string };
  private strict: boolean;

  constructor(
    fieldMap: { [index: string]: string[] } = FIELD_MAPPINGS,
    strict: boolean = true,
  ) {
    this.fieldMap = reverseMap(fieldMap);
    this.strict = strict;
  }

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
      output[newCol] = input[key];
    }
    return output;
  }

  recordToStandardValues(
    state: string,
    record: Record<string, string>,
  ): Record<string, string | number | object | boolean> {
    const output: Record<string, string | number | object | boolean> = {
      id: record.id,
      authority_type: coerceToStandardValue(
        record.authority_level,
        getEnumValues(Object.values(AuthorityType)),
      ),
      authority: createAuthorityName(state, record.authority_name),
      type: coerceToStandardValue(
        record.rebate_type.split(',')[0],
        getEnumValues(Object.values(PaymentMethod)),
        VALUE_MAPPINGS.payment_methods,
      ),
      payment_methods: findPaymentMethods(record.rebate_type),
      item: coerceToStandardValue(
        record.technology,
        new Set(Object.keys(ITEMS_SCHEMA)),
        VALUE_MAPPINGS.item,
      ),
      program: createProgramName(
        state,
        record.authority_name,
        record.program_title,
      ),
      amount: createAmount(record),
      owner_status: findOwnerStatus(record.owner_status),
      short_description: {
        en: record.program_description,
      },
    };
    if (record.program_start !== undefined && record.program_start !== '') {
      output.start_date = +parseDateToYear(record.program_start);
    }
    if (record.program_end !== undefined && record.program_end !== '') {
      output.end_date = +parseDateToYear(record.program_end);
    }
    if (
      record.bonus_description !== undefined &&
      record.bonus_description !== ''
    ) {
      output.bonus_description = true;
    }

    return output;
  }
}
