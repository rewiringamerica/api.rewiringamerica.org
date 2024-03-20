import { GaxiosPromise, GaxiosResponse } from 'gaxios';
import { sheets_v4 } from 'googleapis';
import { test } from 'tap';
<<<<<<< HEAD
import { IncentiveFile } from '../../scripts/incentive-spreadsheet-registry';
import {
  SheetsClient,
  extractIdsFromUrl,
  retrieveGoogleSheet,
=======
import {
  extractIdsFromUrl,
>>>>>>> edc75f1 (Add way to read Google Sheets API and retrieve hyperlinks.)
  spreadsheetToJson,
} from '../../scripts/incentive-spreadsheet-to-json';
import { DataRefiner } from '../../scripts/lib/data-refiner';
import { flatToNestedValidate } from '../../scripts/lib/format-converter';
import {
  FIELD_MAPPINGS,
  VALUE_MAPPINGS,
} from '../../scripts/lib/spreadsheet-mappings';
import { SpreadsheetStandardizer } from '../../scripts/lib/spreadsheet-standardizer';

test('correct row to record transformation', tap => {
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
        'Program Description (Spanish)': 'Unas palabras en español.',
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
          es: 'Unas palabras en español.',
        },
        start_date: '2022-01-01',
        end_date: '2026-12-31',
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
        incentives: ['VA-1'],
      },
    },
  };
  const standardizer = new SpreadsheetStandardizer(
    FIELD_MAPPINGS,
    VALUE_MAPPINGS,
    true,
  );
  const refiner = new DataRefiner(fakeIncomeThresholds);
  for (const tc of testCases) {
    const standardized = standardizer.standardize(tc.input);
    const [valids, invalids] = flatToNestedValidate([standardized]);
    tap.equal(invalids.length, 0, `Invalid record: ${invalids[0]}`);
    tap.matchOnlyStrict(refiner.refineCollectedData('va', valids[0]), tc.want);
  }
  tap.end();
});

test('drop records with omit_from_api marked', tap => {
  // Standard case: record appears as invalid.
  const keepInput = {
    ID: 'VA-1',
    some_other_field: 'value',
  };
  const output = spreadsheetToJson('VA', [keepInput], false, null, null);
  tap.equal(output.invalidCollectedIncentives.length, 1);

  // With omit_from_api: it's dropped entirely.
  const omitInput = {
    ID: 'VA-1',
    some_other_field: 'value',
    omit_from_api: 'true',
  };
  const {
    invalidCollectedIncentives,
    invalidStateIncentives,
    validStateIncentives,
  } = spreadsheetToJson('VA', [omitInput], false, null, null);
  tap.equal(invalidCollectedIncentives.length, 0);
  tap.equal(invalidStateIncentives.length, 0);
  tap.equal(validStateIncentives.length, 0);
  tap.end();
});

test('extract IDs from a standard URL', tap => {
  const url =
    'https://docs.google.com/spreadsheets/d/1nITjSNRWJjSusB0fWuSS63fqynm_4Co7KEeuo9Cm7fU/pub?gid=30198531&single=true&output=csv';
  tap.strictSame(extractIdsFromUrl(url), {
    spreadsheetId: '1nITjSNRWJjSusB0fWuSS63fqynm_4Co7KEeuo9Cm7fU',
    incentiveDataSheetId: 30198531,
  });
  tap.end();
});

test('fails to extract IDs from a nonstandard URL', tap => {
  const url = 'https://docs.google.com/something-else';
  tap.throws(() => extractIdsFromUrl(url));
  tap.end();
});

enum FakeSheetsClientMode {
  Undefined,
  BadStatus,
  BadSheetId,
}

// Fake Google Sheets API client to make it easier to test.
class FakeSheetsClient implements SheetsClient {
  mode: FakeSheetsClientMode;
  spreadsheets = { get: this.get.bind(this) };

  constructor(mode: FakeSheetsClientMode) {
    this.mode = mode;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(req: {
    spreadsheetId: string;
    includeGridData: boolean;
  }): GaxiosPromise<sheets_v4.Schema$Spreadsheet> {
    const baseResponse: GaxiosResponse<sheets_v4.Schema$Spreadsheet> = {
      data: {},
      config: {},
      headers: {},
      status: 200,
      statusText: 'Unused',
      request: {
        responseURL: 'http',
      },
    };
    if (this.mode === FakeSheetsClientMode.BadStatus) {
      baseResponse.status = 500;
      return baseResponse;
    } else if (this.mode === FakeSheetsClientMode.BadSheetId) {
      baseResponse.data = {
        sheets: [
          {
            properties: {
              // This sheetId doesn't match the requested one in the tests.
              sheetId: 111111111,
            },
          },
        ],
      };
      return baseResponse;
    } else {
      throw new Error('Unhandled FakeSheetsClient mode');
    }
  }
}

test('fails when spreadsheet get returns an unsuccessful request', async tap => {
  const file: IncentiveFile = {
    filepath: 'unused',
    collectedFilepath: 'unused',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/some-spreadsheet-id/pub?gid=123456789&single=true&output=csv',
  };

  tap.rejects(async () => {
    const badStatusClient = new FakeSheetsClient(
      FakeSheetsClientMode.BadStatus,
    );
    await retrieveGoogleSheet(file, badStatusClient);
  });

  tap.rejects(async () => {
    const badSheetIdClient = new FakeSheetsClient(
      FakeSheetsClientMode.BadSheetId,
    );
    await retrieveGoogleSheet(file, badSheetIdClient);
  });
});
