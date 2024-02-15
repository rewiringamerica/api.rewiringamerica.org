import _ from 'lodash';
import { test } from 'tap';
import {
  flatToNested,
  flatToNestedValidate,
} from '../../scripts/lib/format-converter';

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

test('validation work', tap => {
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
      'Receive up to $50 rebate for an Energy Start certified electric ventless or vented clothes dryer from an approved retailer.',
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
