import { test } from 'tap';
import {
  FIELD_MAPPINGS,
  VALUE_MAPPINGS,
} from '../../scripts/lib/spreadsheet-mappings';
import { SpreadsheetStandardizer } from '../../scripts/lib/spreadsheet-standardizer';

test('correctly rename columns in strict mode', tap => {
  let standardizer = new SpreadsheetStandardizer(
    { new_name: ['old_name'] },
    {},
    true,
  );
  tap.matchOnly(
    standardizer.standardize({ old_name: 'foo' }),
    { new_name: 'foo' },
    'standard rename',
  );

  standardizer = new SpreadsheetStandardizer(
    { new_name: ['old_name'] },
    {},
    true,
  );
  tap.throws(() => {
    standardizer.standardize({ old_name: 'foo', unrelated_name: 'bar' });
  }, 'Error on field not in map in strict mode');

  tap.end();
});

test('correctly rename columns in non-strict mode', tap => {
  let standardizer = new SpreadsheetStandardizer(
    { new_name: ['old_name'] },
    {},
    false,
  );
  tap.matchOnly(
    standardizer.standardize({ old_name: 'foo' }),
    { new_name: 'foo' },
    'standard rename',
  );

  standardizer = new SpreadsheetStandardizer(
    { new_name: ['old_name'] },
    {},
    false,
  );
  tap.matchOnly(
    standardizer.standardize({ old_name: 'foo', unrelated_name: 'bar' }),
    { new_name: 'foo', unrelated_name: 'bar' },
    'preserves extraneous column in non-strict mode',
  );

  tap.end();
});

test('Rename columns using punctuation characters and unusual spacing', tap => {
  const standardizer = new SpreadsheetStandardizer(
    { new_name: ['unclean original name with weird chars'] },
    {},
    true,
  );
  tap.matchOnly(
    standardizer.standardize({
      'Unclean  original(name  with weird chars    )': 'Column Value',
    }),
    { new_name: 'Column Value' },
    'standard rename',
  );
  tap.end();
});

test('Rename values', tap => {
  const standardizer = new SpreadsheetStandardizer(
    {},
    {
      column: { canonical_value: ['possible_alias'] },
      column_with_cleaning: {
        canonical_value: ['Alias With Spaces and Chars'],
      },
    },
    false,
  );
  tap.matchOnly(
    standardizer.standardize({
      column: 'possible_alias',
      column_with_cleaning: 'Alias With Spaces * and Chars *',
    }),
    { column: 'canonical_value', column_with_cleaning: 'canonical_value' },
  );
  tap.end();
});

test('Cleans dollars and deals with owner_status Both', tap => {
  const standardizer = new SpreadsheetStandardizer({}, {}, false);
  tap.matchOnly(
    standardizer.standardize({
      'amount.number': '$50',
      owner_status: 'Both',
    }),
    { 'amount.number': '50', owner_status: 'homeowner, renter' },
  );
  tap.end();
});

test('representative example', tap => {
  const standardizer = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    true,
  );

  const input = {
    ID: 'VA-1',
    'Data Source URL(s)': 'https://takechargeva.com/programs/for-your-home',
    'Authority Level*': 'Utility',
    'Authority (Name)*': 'Appalachian Power',
    'Program Title*': 'Take Charge Virginia Efficient Products Program',
    'Program URL':
      'https://takechargeva.com/programs/for-your-home/efficient-products-program-appliances',
    'Technology*': 'Heat Pump Dryers / Clothes Dryer,Induction Cooktop',
    "Technology (If selected 'Other')": '',
    'Program Description (guideline)':
      'Receive up to $50 rebate for an Energy Star certified electric ventless or vented clothes dryer from an approved retailer.',
    'Program Status': 'Active',
    'Program Start (MM/DD/YYYY)': '1/1/2022',
    'Program End (MM/DD/YYYY)': '12/31/2026',
    'Rebate Type': 'Rebate',
    'Rebate Value*': '$50',
    'Amount Type*': 'dollar amount',
    'Number*': '',
    Unit: '',
    'Amount Minimum': '',
    'Amount Maximum': '$50',
    'Amount Representative (only for average values)': '',
    'Bonus Description': '',
    'Equipment Standards Restrictions': 'Must be ENERGY STAR certified.',
    'Equipment Capacity Restrictions': '',
    'Contractor Restrictions': '',
    'Income Restrictions': '',
    'Tax-filing Status Restrictions': '',
    'Homeowner/ Renter': '',
    'Other Restrictions':
      'Customers can only apply for one rebate of this type per calendar year.',
    'Stacking Details': '',
    'Financing Details': '',
  };

  tap.matchOnly(standardizer.standardize(input), {
    id: 'VA-1',
    data_urls: 'https://takechargeva.com/programs/for-your-home',
    authority_type: 'utility',
    authority_name: 'Appalachian Power',
    program_title: 'Take Charge Virginia Efficient Products Program',
    program_url:
      'https://takechargeva.com/programs/for-your-home/efficient-products-program-appliances',
    items: 'heat_pump_clothes_dryer,electric_stove',
    item_if_selected_other: '',
    'short_description.en':
      'Receive up to $50 rebate for an Energy Star certified electric ventless or vented clothes dryer from an approved retailer.',
    program_status: 'active',
    start_date: '2022-01-01',
    end_date: '2026-12-31',
    payment_methods: 'rebate',
    rebate_value: '$50',
    'amount.type': 'dollar_amount',
    'amount.number': '',
    'amount.unit': '',
    'amount.minimum': '',
    'amount.maximum': '50',
    'amount.representative': '',
    bonus_description: '',
    equipment_standards_restrictions: 'Must be ENERGY STAR certified.',
    equipment_capacity_restrictions: '',
    contractor_restrictions: '',
    income_restrictions: '',
    filing_status: '',
    owner_status: '',
    other_restrictions:
      'Customers can only apply for one rebate of this type per calendar year.',
    stacking_details: '',
    financing_details: '',
  });

  tap.end();
});
