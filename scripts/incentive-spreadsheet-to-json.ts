import Ajv from 'ajv';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import minimist from 'minimist';

import { AuthorityType } from '../src/data/authorities';
import { STATE_SCHEMA, StateIncentive } from '../src/data/state_incentives';
import { AmountType, AmountUnit } from '../src/data/types/amount';
import { ItemType, PaymentMethod } from '../src/data/types/incentive-types';
import { ITEMS_SCHEMA, Item } from '../src/data/types/items';
import { LOCALIZABLE_STRING_SCHEMA } from '../src/data/types/localizable-string';
import { OwnerStatus } from '../src/data/types/owner-status';
import { ColumnConverter, FIELD_MAPPINGS } from './column-converter';
import { EnumMaps } from './enum_maps';
import { FILES, IncentiveFile } from './incentive-spreadsheets-registry';
import { createAuthorityName, createProgramName } from './programs_updater';

const ajv = new Ajv({ allErrors: true });

const validate = ajv.addSchema(LOCALIZABLE_STRING_SCHEMA).compile(STATE_SCHEMA);

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

function findItem(input: string, mapping: Record<string, string>): string {
  let copy = input.replaceAll('\n', '');
  if (copy in mapping) {
    copy = mapping[copy];
  }
  for (const key in ITEMS_SCHEMA) {
    if (copy.toLowerCase().replaceAll(' ', '_') === key) {
      return key as keyof typeof ITEMS_SCHEMA;
    }
  }
  if (strict) {
    throw new Error(`Missing Item: ${input}, possibly mapped to ${copy}`);
  } else {
    return `TODO: ${input}`;
  }
}

type enumsOfInterest = (
  | AmountType
  | AmountUnit
  | AuthorityType
  | Item
  | ItemType
  | PaymentMethod
)[];

function coerceToEnum(
  input: string,
  enumx: enumsOfInterest,
  mapping: Record<string, string> = {},
): string {
  if (input === undefined) return "TODO: undefined"
  let copy = input.replaceAll('\n', '');
  if (copy in mapping) {
    copy = mapping[copy];
  }
  for (const key of enumx.filter(value => typeof value === 'string')) {
    if (copy.toLowerCase().replaceAll(' ', '_') === key) {
      return key;
    }
  }
  if (strict) {
    throw new Error(
      `Missing enum: ${input} (mapped to ${copy}) in enum ${enumx}`,
    );
  } else {
    return `TODO: ${input}`;
  }
}

function findPaymentMethods(input: string): string[] {
  if (input === undefined || input === '') {
    return [];
  }
  const methods: string[] = []
  for (const method of input.split(",")) {
    methods.push(coerceToEnum(method, Object.values(PaymentMethod)))
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

function createAmount(
  input: Record<string, string>,
): Record<string, number | string> {
  const amount: Record<string, number | string> = {
    type: coerceToEnum(
      input.amount_type,
      Object.values(AmountType),
      EnumMaps.amount_type,
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
    amount.unit = coerceToEnum(input.unit, Object.values(AmountUnit));
  }
  return amount;
}

function recordToJson(
  state: string,
  record: Record<string, string>,
): Record<string, string | number | object | boolean> {
  console.log(record)
  const output: Record<string, string | number | object | boolean> = {
    id: record.id,
    authority_type: coerceToEnum(
      record.authority_level,
      Object.values(AuthorityType),
      EnumMaps.authority_type,
    ),
    authority: createAuthorityName(state, record.authority_name),
    type: coerceToEnum(record.rebate_type, Object.values(PaymentMethod), EnumMaps.type),
    payment_methods: findPaymentMethods(record.rebate_type),
    item: findItem(record.technology, EnumMaps.item),
    item_type: coerceToEnum(
      record.rebate_type,
      Object.values(ItemType),
      EnumMaps.item_type,
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

export const _private = {
  recordToJson: recordToJson,
};

async function convertToJson(
  state: string,
  file: IncentiveFile,
  write: boolean,
) {
  const response = await fetch(file.sheetUrl);
  const csvContent = await response.text();
  const rows = parse(csvContent, {
    columns: true,
    from_line: file.headerRowNumber ?? 1,
  });

  const converter = new ColumnConverter(FIELD_MAPPINGS, true);
  const rejects: Record<string, string | number | boolean | object>[] = [];
  const jsons: StateIncentive[] = [];
  rows.forEach((row: Record<string, string>) => {
    const renamed = converter.convertFieldNames(row);
    const json = recordToJson(state, renamed);
    if (!validate(json)) {
      if (validate.errors !== undefined && validate.errors !== null) {
        json.errors = validate.errors;
      }
      rejects.push(json);
    } else {
      jsons.push(json);
    }
  });

  if (write) {
    fs.writeFileSync(
      file.filepath,
      JSON.stringify(jsons, null, 2) + '\n', // include newline to satisfy prettier
      'utf-8',
    );
    fs.writeFileSync(
      file.filepath.replace('.json', '_rejects.json'),
      JSON.stringify(rejects, null, 2) + '\n', // include newline to satisfy prettier
      'utf-8',
    );
  }
}

(async function () {
  const args = minimist(process.argv.slice(2), { boolean: ['write'] });

  const bad = args._.filter(f => !(f in FILES));
  if (bad.length) {
    console.error(
      `${bad.join(', ')} not valid (choices: ${Object.keys(FILES).join(', ')})`,
    );
    process.exit(1);
  }

  args._.forEach(async fileIdent => {
    await convertToJson(fileIdent, FILES[fileIdent], args.write);
  });
})();
