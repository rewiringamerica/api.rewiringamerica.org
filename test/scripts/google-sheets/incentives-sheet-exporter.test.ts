import { test } from 'tap';
import { SpreadsheetData } from '../../../scripts/lib/format-converter';
import { spreadsheetToGoogleSheet } from '../../../scripts/lib/google-sheets/incentives-sheet-exporter';

test('Spreadsheet format converts to Google sheet without standard header', tap => {
  const input: SpreadsheetData = {
    headers: ['foo', 'bar', 'baz', 'qux'],
    records: [
      { foo: 3, baz: 'string' },
      { bar: true, baz: 10 },
    ],
  };
  const output = spreadsheetToGoogleSheet(input, false, 'baz', [
    {
      column_aliases: ['bar'],
      description: 'A property',
      values: {
        valA: { value_aliases: ['unused'] },
        valB: { value_aliases: ['unused'] },
      },
    },
  ]);

  const expected = {
    data: [
      {
        rowData: [
          {
            values: [
              {
                userEnteredValue: { stringValue: 'foo' },
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                  textFormat: { bold: true },
                  wrapStrategy: 'WRAP',
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                },
              },
              {
                userEnteredValue: { stringValue: 'bar' },
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                  textFormat: { bold: true },
                  wrapStrategy: 'WRAP',
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                },
              },
              {
                userEnteredValue: { stringValue: 'baz' },
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                  textFormat: { bold: true },
                  wrapStrategy: 'WRAP',
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                },
              },
              {
                userEnteredValue: { stringValue: 'qux' },
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                  textFormat: { bold: true },
                  wrapStrategy: 'WRAP',
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                },
              },
              {
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                  textFormat: { bold: true },
                  wrapStrategy: 'WRAP',
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                },
                userEnteredValue: {
                  stringValue: 'Description character count',
                },
              },
              {
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                  textFormat: { bold: true },
                  wrapStrategy: 'WRAP',
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                },
                userEnteredValue: { stringValue: 'Description word count' },
              },
            ],
          },
          {
            values: [
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
                userEnteredValue: { numberValue: 3 },
              },
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
                dataValidation: {
                  strict: true,
                  showCustomUi: true,
                  condition: {
                    type: 'ONE_OF_RANGE',
                    values: [
                      {
                        userEnteredValue:
                          "='Standardized Enum List Values'!$A$2:$A$3",
                      },
                    ],
                  },
                },
              },
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
                userEnteredValue: { stringValue: 'string' },
              },
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
              },
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
                userEnteredValue: { formulaValue: '=LEN(C2)' },
              },
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
                userEnteredValue: {
                  formulaValue: '=IF(C2="","",COUNTA(SPLIT(C2," ")))',
                },
              },
            ],
          },
          {
            values: [
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
              },
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
                userEnteredValue: { boolValue: true },
                dataValidation: {
                  strict: true,
                  showCustomUi: true,
                  condition: {
                    type: 'ONE_OF_RANGE',
                    values: [
                      {
                        userEnteredValue:
                          "='Standardized Enum List Values'!$A$2:$A$3",
                      },
                    ],
                  },
                },
              },
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
                userEnteredValue: { numberValue: 10 },
              },
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
              },
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
                userEnteredValue: { formulaValue: '=LEN(C3)' },
              },
              {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'TOP',
                },
                userEnteredValue: {
                  formulaValue: '=IF(C3="","",COUNTA(SPLIT(C3," ")))',
                },
              },
            ],
          },
        ],
        columnMetadata: [
          { pixelSize: 150 },
          { pixelSize: 150 },
          { pixelSize: 150 },
          { pixelSize: 150 },
        ],
      },
    ],
    properties: {
      sheetId: 0,
      gridProperties: { frozenRowCount: 1, frozenColumnCount: 1 },
    },
  };

  tap.strictSame(output, expected);
  tap.end();
});
