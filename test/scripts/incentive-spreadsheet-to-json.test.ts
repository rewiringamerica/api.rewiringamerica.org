import { test } from 'tap';
import {
  FIELD_MAPPINGS,
  VALUE_MAPPINGS,
} from '../../scripts/lib/spreadsheet-mappings';
import { SpreadsheetStandardizer } from '../../scripts/lib/spreadsheet-standardizer';

test('correct row to record transformation', async tap => {
  const testCases: {
    input: Record<string, string>;
    want: Record<string, string | number | object | boolean>;
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
          'Receive a $50 rebate for an Energy Star certified electric ventless\nor vented\nclothes dryer from an approved retailer',
        'Program Status': 'Active',
        'Program Start (MM/DD/YYYY)': '1/1/2022',
        'Program End (MM/DD/YYYY)': '12/31/2026',
        'Rebate Type': 'Rebate (post purchase)',
        'Rebate Value*': '$50',
        'Amount Type*': 'dollar amount',
        'Number*': '50',
        Unit: '',
        'Amount Minimum': '',
        'Amount Maximum': '',
        'Amount Representative (only for average values)': '',
        'Bonus Description': 'Here is some bonus information',
        'Equipment Standards Restrictions': 'Must be ENERGY STAR certified.',
        'Equipment Capacity Restrictions': '',
        'Contractor Restrictions': '',
        'Income Restrictions':
          'Must have income according to some table linked elsewhere',
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
          'va_appalachianPower_takeChargeVirginiaEfficientProductsProgram',
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
        bonus_available: true,
        low_income: 'va-appalachian-power',
      },
    },
  ];

  const fakeIncomeThresholds = {
    va: {
      'va-appalachian-power': {
        source_url: 'url',
        thresholds: {},
      },
    },
  };
  const columnConverter = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    true,
    fakeIncomeThresholds,
  );
  for (const tc of testCases) {
    const renamed = columnConverter.convertFieldNames(tc.input);
    tap.matchOnly(
      columnConverter.recordToStandardValues('va', renamed),
      tc.want,
    );
  }
});
