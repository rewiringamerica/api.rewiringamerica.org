import { test } from 'tap';
import { generateStandardEnumsSheet } from '../../../scripts/lib/google-sheets/standardized-enums';
import { FieldMetadata } from '../../../scripts/lib/spreadsheet-mappings';

test('Creates correct standardized enums sheet', tap => {
  const metadata: { [index: string]: FieldMetadata } = {
    fieldA: {
      column_aliases: ['Field A', 'unused alias'],
      description: 'The field you gotta have',
      critical: true,
      values: {
        valueA: {
          value_aliases: ['Value A', 'unused value alias'],
          description: 'A value with a description.',
        },
        valueB: {
          value_aliases: ['Value B'],
        },
        valueC: {
          value_aliases: ['Value C'],
          description: 'Another description.',
        },
      },
    },
    fieldB: {
      column_aliases: ['Field B'],
      description: 'A less important field.',
    },
    fieldC: {
      column_aliases: ['Field C'],
      description: 'Another field with values.',
      values: {
        nameA: {
          value_aliases: ['Name A'],
          description: 'foo bar baz',
        },
      },
    },
  };
  const output = generateStandardEnumsSheet(metadata);

  const expected = {
    data: [
      {
        rowData: [
          {
            values: [
              {
                userEnteredValue: { stringValue: 'Field A' },
                userEnteredFormat: {
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                  textFormat: { bold: true },
                  borders: {
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                },
              },
              {
                userEnteredValue: { stringValue: 'Definition' },
                userEnteredFormat: {
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                  textFormat: { bold: true },
                  borders: {
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                },
              },
              {},
              {
                userEnteredValue: { stringValue: 'Field C' },
                userEnteredFormat: {
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                  textFormat: { bold: true },
                  borders: {
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                },
              },
              {
                userEnteredValue: { stringValue: 'Definition' },
                userEnteredFormat: {
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                  textFormat: { bold: true },
                  borders: {
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                  wrapStrategy: 'WRAP',
                },
              },
              {},
            ],
          },
          {
            values: [
              {
                userEnteredValue: { stringValue: 'Value A' },
                userEnteredFormat: {
                  wrapStrategy: 'WRAP',
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                },
              },
              {
                userEnteredValue: {
                  stringValue: 'A value with a description.',
                },
                userEnteredFormat: {
                  wrapStrategy: 'WRAP',
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                },
              },
              { userEnteredFormat: { wrapStrategy: 'WRAP' } },
              {
                userEnteredValue: { stringValue: 'Name A' },
                userEnteredFormat: {
                  wrapStrategy: 'WRAP',
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                },
              },
              {
                userEnteredValue: { stringValue: 'foo bar baz' },
                userEnteredFormat: {
                  wrapStrategy: 'WRAP',
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                },
              },
              { userEnteredFormat: { wrapStrategy: 'WRAP' } },
            ],
          },
          {
            values: [
              {
                userEnteredValue: { stringValue: 'Value B' },
                userEnteredFormat: {
                  wrapStrategy: 'WRAP',
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                },
              },
              {
                userEnteredFormat: {
                  wrapStrategy: 'WRAP',
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                },
              },
              { userEnteredFormat: { wrapStrategy: 'WRAP' } },
              { userEnteredFormat: { wrapStrategy: 'WRAP' } },
              { userEnteredFormat: { wrapStrategy: 'WRAP' } },
              { userEnteredFormat: { wrapStrategy: 'WRAP' } },
            ],
          },
          {
            values: [
              {
                userEnteredValue: { stringValue: 'Value C' },
                userEnteredFormat: {
                  wrapStrategy: 'WRAP',
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                },
              },
              {
                userEnteredValue: { stringValue: 'Another description.' },
                userEnteredFormat: {
                  wrapStrategy: 'WRAP',
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                },
              },
              { userEnteredFormat: { wrapStrategy: 'WRAP' } },
              { userEnteredFormat: { wrapStrategy: 'WRAP' } },
              { userEnteredFormat: { wrapStrategy: 'WRAP' } },
              { userEnteredFormat: { wrapStrategy: 'WRAP' } },
            ],
          },
        ],
        columnMetadata: [
          { pixelSize: 125 },
          { pixelSize: 125 },
          { pixelSize: 50 },
          { pixelSize: 125 },
          { pixelSize: 125 },
        ],
      },
    ],
    properties: { title: 'Standardized Enum List Values', sheetId: 1 },
    protectedRanges: [
      {
        range: {
          sheetId: 1,
        },
        requestingUserCanEdit: true,
        warningOnly: true,
      },
    ],
  };

  tap.strictSame(output, expected);
  tap.end();
});
