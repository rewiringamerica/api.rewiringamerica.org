import { test } from 'tap';
import { ColumnConverter } from '../../scripts/lib/column-converter';
import { FIELD_MAPPINGS } from '../../scripts/lib/spreadsheet-mappings';

test('correctly rename columns in strict mode', tap => {
  let converter = new ColumnConverter({ new_name: ['old_name'] }, true);
  tap.matchOnly(
    converter.convertFieldNames({ old_name: 'foo' }),
    { new_name: 'foo' },
    'standard rename',
  );

  converter = new ColumnConverter({ new_name: ['old_name'] }, true);
  tap.throws(() => {
    converter.convertFieldNames({ old_name: 'foo', unrelated_name: 'bar' });
  }, 'Error on field not in map in strict mode');

  tap.end();
});

test('correctly rename columns in non-strict mode', tap => {
  let converter = new ColumnConverter({ new_name: ['old_name'] }, false);
  tap.matchOnly(
    converter.convertFieldNames({ old_name: 'foo' }),
    { new_name: 'foo' },
    'standard rename',
  );

  converter = new ColumnConverter({ new_name: ['old_name'] }, false);
  tap.matchOnly(
    converter.convertFieldNames({ old_name: 'foo', unrelated_name: 'bar' }),
    { new_name: 'foo', unrelated_name: 'bar' },
    'preserves extraneous column in non-strict mode',
  );

  tap.end();
});

test('representative example', tap => {
  const converter = new ColumnConverter(FIELD_MAPPINGS, true);

  const input = {
    ID: 'VA-1',
    'Data Source URL(s)': 'https://takechargeva.com/programs/for-your-home',
    'Authority Level*': 'Utility',
    'Authority (Name)*': 'Appalachian Power',
    'Program Title*': 'Take Charge Virginia Efficient Products Program',
    'Program URL':
      'https://takechargeva.com/programs/for-your-home/efficient-products-program-appliances',
    'Technology*': 'Heat Pump Dryers / Clothes Dryer',
    "Technology (If selected 'Other')": '',
    'Program Description (guideline)':
      'Receive up to $50 rebate for an Energy Start certified electric ventless or vented clothes dryer from an approved retailer.',
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

  tap.matchOnly(converter.convertFieldNames(input), {
    id: 'VA-1',
    data_urls: 'https://takechargeva.com/programs/for-your-home',
    authority_level: 'Utility',
    authority_name: 'Appalachian Power',
    program_title: 'Take Charge Virginia Efficient Products Program',
    program_url:
      'https://takechargeva.com/programs/for-your-home/efficient-products-program-appliances',
    technology: 'Heat Pump Dryers / Clothes Dryer',
    technology_if_selected_other: '',
    program_description:
      'Receive up to $50 rebate for an Energy Start certified electric ventless or vented clothes dryer from an approved retailer.',
    program_status: 'Active',
    program_start: '1/1/2022',
    program_end: '12/31/2026',
    rebate_type: 'Rebate',
    rebate_value: '$50',
    amount_type: 'dollar amount',
    number: '',
    unit: '',
    amount_minimum: '',
    amount_maximum: '$50',
    amount_representative: '',
    bonus_description: '',
    equipment_standards_restrictions: 'Must be ENERGY STAR certified.',
    equipment_capacity_restrictions: '',
    contractor_restrictions: '',
    income_restrictions: '',
    tax_filing_status_restrictions: '',
    owner_status: '',
    other_restrictions:
      'Customers can only apply for one rebate of this type per calendar year.',
    stacking_details: '',
    financing_details: '',
  });

  tap.end();
});
