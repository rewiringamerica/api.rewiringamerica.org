import { sheets_v4 } from 'googleapis';
import _ from 'lodash';
import { test } from 'tap';
import {
  LinkMode,
  collectedIncentivesToSpreadsheet,
  flatToNested,
  flatToNestedValidate,
  googleSheetToFlatData,
} from '../../scripts/lib/format-converter';
import { FIELD_MAPPINGS } from '../../scripts/lib/spreadsheet-mappings';
import { AuthorityType } from '../../src/data/authorities';
import { CollectedIncentive } from '../../src/data/state_incentives';
import { AmountType } from '../../src/data/types/amount';
import { PaymentMethod } from '../../src/data/types/incentive-types';
import { OwnerStatus } from '../../src/data/types/owner-status';

test('empty fields are removed', tap => {
  const objs = [
    {
      basicProperty: 'foo',
      removedProperty: '',
    },
  ];
  tap.matchOnly(flatToNested(objs), [
    { basicProperty: 'foo' },
  ]);
  tap.end();
});

test('array fields are split up', tap => {
  const objs = [
    {
      basicProperty: 'foo',
      arrayProperty: 'bar,baz',
    },
  ];
  tap.matchOnly(flatToNested(objs, ['arrayProperty']), [
    { basicProperty: 'foo', arrayProperty: ['bar', 'baz'] },
  ]);
  tap.end();
});

test('eligible boolean fields are converted', tap => {
  const objs = [
    {
      basicProperty: 'foo',
      booleanProperty: 'TRUE',
    },
  ];
  tap.matchOnly(flatToNested(objs, [], ['booleanProperty']), [
    { basicProperty: 'foo', booleanProperty: true },
  ]);
  tap.end();
});

test('nested columns properly expanded', tap => {
  const objs = [
    {
      unnested: 'foo',
      'nested.array': 'bar,baz',
      'nested.flat': 'qux',
      'deeply.nested.flat': 'quux',
    },
  ];
  tap.matchOnly(flatToNested(objs, ['nested.array']), [
    {
      unnested: 'foo',
      nested: {
        array: ['bar', 'baz'],
        flat: 'qux',
      },
      deeply: { nested: { flat: 'quux' } },
    },
  ]);
  tap.end();
});

test('validation works', tap => {
  const fullInput = {
    id: 'VA-1',
    data_urls: 'https://takechargeva.com/programs/for-your-home',
    authority_type: 'utility',
    authority_name: 'Appalachian Power',
    program_title: 'Take Charge Virginia Efficient Products Program',
    program_url:
      'https://takechargeva.com/programs/for-your-home/efficient-products-program-appliances',
    item: 'heat_pump_clothes_dryer',
    item_if_selected_other: '',
    'short_description.en':
      'Receive up to $50 rebate for an Energy Star certified electric ventless or vented clothes dryer from an approved retailer.',
    program_status: 'Active',
    program_start_raw: '1/1/2022',
    program_end_raw: '12/31/2026',
    payment_methods: 'rebate',
    rebate_value: '50',
    'amount.type': 'dollar_amount',
    'amount.number': '50',
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
    owner_status: 'homeowner',
    other_restrictions:
      'Customers can only apply for one rebate of this type per calendar year.',
    stacking_details: '',
    financing_details: '',
  };
  // Take a valid record; make an invalid copy by removing a field.
  // Then verify that one record is valid and one is not.
  const partialInput: Partial<typeof fullInput> = _.omit(fullInput, 'id');
  const [valid, invalid] = flatToNestedValidate([fullInput, partialInput]);
  tap.equal(valid.length, 1);
  tap.equal(invalid.length, 1);
  tap.end();
});

test('Google sheet with links is converted to parseable format', tap => {
  const input: sheets_v4.Schema$Sheet = {
    data: [
      {
        rowData: [
          {
            values: [
              {
                formattedValue: 'Column 1',
              },
              {
                formattedValue: 'Column 2',
              },
            ],
          },
          {
            values: [
              {
                formattedValue: 'Regular cell val',
              },
              {
                formattedValue: 'Regular cell val 2',
              },
            ],
          },
          {
            values: [
              {
                formattedValue: 'whole cell link',
                hyperlink: 'http://foo.com',
              },

              {
                formattedValue: 'cell with multiple links',
                textFormatRuns: [
                  {
                    format: {
                      link: {
                        uri: 'http://bar.com',
                      },
                    },
                  },
                  {
                    startIndex: 4,
                    format: {},
                  },
                  {
                    startIndex: 10,
                    format: {
                      link: {
                        uri: 'http://baz.com',
                      },
                    },
                  },
                  {
                    startIndex: 18,
                    format: {},
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  // LinkMode.Convert: returns altered data
  const output = googleSheetToFlatData(input, LinkMode.Convert, 1);
  tap.strictSame(output, [
    { 'Column 1': 'Regular cell val', 'Column 2': 'Regular cell val 2' },
    {
      'Column 1': 'whole cell link (link(s): http://foo.com)',
      'Column 2':
        'cell with multiple links (link(s): http://bar.com, http://baz.com)',
    },
  ]);

  // LinkMode.Drop: returns data with links gone
  const linklessOutput = googleSheetToFlatData(input, LinkMode.Drop, 1);
  tap.strictSame(linklessOutput, [
    { 'Column 1': 'Regular cell val', 'Column 2': 'Regular cell val 2' },
    {
      'Column 1': 'whole cell link',
      'Column 2': 'cell with multiple links',
    },
  ]);

  // LinkMode.Error: errors
  tap.throws(
    () => googleSheetToFlatData(input, LinkMode.Error, 1),
    new Error('Hyperlinks found in spreadsheet'),
  );
  tap.end();
});

test('CollectedIncentives are converted into spreadsheet format', tap => {
  const incentives: CollectedIncentive[] = [
    {
      id: 'VA-1',
      data_urls: ['appalachia.com'],
      authority_name: 'Appalachian Power',
      authority_type: AuthorityType.Utility,
      item: 'heat_pump_clothes_dryer',
      program_title: 'The Appalachian Program',
      program_url: 'appalachianprogram.com',
      program_status: 'Active',
      rebate_value: '$50 flat rate',
      payment_methods: [PaymentMethod.Rebate],
      amount: {
        type: AmountType.DollarAmount,
        number: 50,
      },
      owner_status: [
        OwnerStatus.Homeowner,
        OwnerStatus.Renter,
      ],
      short_description: {
        en: 'Receive a $50 rebate for an Energy Star certified electric ventless or vented clothes dryer from an approved retailer.',
        es: 'Unas palabras en español.',
      },
      start_date: '2022-01-01',
      end_date: '2026-12-31',
      omit_from_api: true,
    },
  ];
  const output = collectedIncentivesToSpreadsheet(incentives, FIELD_MAPPINGS);
  const expected = {
    records: [
      {
        ID: 'VA-1',
        'Data Source URL(s)': ['appalachia.com'],
        'Authority (Name) *': 'Appalachian Power',
        'Authority Level *': 'Utility',
        'Technology *': 'Heat Pump Dryers / Clothes Dryer',
        'Program Title *': 'The Appalachian Program',
        'Program URL': 'appalachianprogram.com',
        'Program Status': 'Active',
        'Rebate Value *': '$50 flat rate',
        'Rebate Type': ['Rebate (Post Purchase)'],
        'Amount Type *': 'Dollar Amount',
        'Number *': 50,
        'Homeowner / Renter': ['Homeowner', 'Renter'],
        'Program Description (guideline)':
          'Receive a $50 rebate for an Energy Star certified electric ventless or vented clothes dryer from an approved retailer.',
        'Program Description (Spanish)': 'Unas palabras en español.',
        'Program Start': '2022-01-01',
        'Program End': '2026-12-31',
        'Omit from API?': true,
      },
    ],
    headers: [
      'ID',
      'Data Source URL(s)',
      'Authority Level *',
      'Authority (Name) *',
      'Geographic Eligibility',
      'Program Title *',
      'Program URL',
      'Technology *',
      "Technology (If selected 'Other')",
      'Program Description (guideline)',
      'Program Description (Spanish)',
      'Program Status',
      'Program Start',
      'Program End',
      'Rebate Type',
      'Rebate Value *',
      'Amount Type *',
      'Number *',
      'Unit',
      'Amount Minimum',
      'Amount Maximum',
      'Amount Representative (only for average values)',
      'Bonus Description',
      'Equipment Standards Restrictions',
      'Equipment Capacity Restrictions',
      'Contractor Restrictions',
      'Income Restrictions',
      'Tax - filing Status Restrictions',
      'Homeowner / Renter',
      'Other Restrictions',
      'Stacking Details',
      'Financing Details',
      'Editorial Notes',
      'Questions',
      'Omit from API?',
    ],
  };

  tap.strictSame(output, expected);
  tap.end();
});
