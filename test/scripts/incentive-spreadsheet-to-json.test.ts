import { test } from 'tap';
import { ColumnConverter } from '../../scripts/lib/column-converter';
import { FIELD_MAPPINGS } from '../../scripts/lib/spreadsheet-mappings';

test('correct row to record transformation', async tap => {
  const testCases: {
    input: Record<string, string>;
    want: Record<string, string | number | object>;
  }[] = [
    {
      input: {
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
          'Receive a $50 rebate for an Energy Star certified electric ventless or vented clothes dryer from an approved retailer.',
        'Program Status': 'Active',
        'Program Start (MM/DD/YYYY)': '1/1/2022',
        'Program End (MM/DD/YYYY)': '12/31/2026',
        'Rebate Type': 'Rebate',
        'Rebate Value*': '$50',
        'Amount Type*': 'dollar amount',
        'Number*': '50',
        Unit: '',
        'Amount Minimum': '',
        'Amount Maximum': '',
        'Amount Representative (only for average values)': '',
        'Bonus Description': '',
        'Equipment Standards Restrictions': 'Must be ENERGY STAR certified.',
        'Equipment Capacity Restrictions': '',
        'Contractor Restrictions': '',
        'Income Restrictions': '',
        'Tax-filing Status Restrictions': '',
        'Homeowner/ Renter': 'Homeowner',
        'Other Restrictions':
          'Customers can only apply for one rebate of this type per calendar year.',
        'Stacking Details': '',
        'Financing Details': '',
      },
      want: {
        id: 'VA-1',
        authority_type: 'utility',
        authority: 'va-appalachian-power',
        type: 'rebate',
        item: 'heat_pump_clothes_dryer',
        payment_methods: ['rebate'],
        program:
          'va_appalachianPowertakeChargeVirginiaEfficientProductsProgram',
        amount: {
          type: 'dollar_amount',
          number: 50,
        },
        owner_status: [
          'homeowner',
        ],
        short_description: {
          en: 'Receive a $50 rebate for an Energy Star certified electric ventless or vented clothes dryer from an approved retailer.',
        },
        start_date: 2022,
        end_date: 2026,
      },
    },
  ];

  const columnConverter = new ColumnConverter(FIELD_MAPPINGS);
  for (const tc of testCases) {
    const renamed = columnConverter.convertFieldNames(tc.input);
    tap.matchOnly(
      columnConverter.recordToStandardValues('va', renamed),
      tc.want,
    );
  }
});
