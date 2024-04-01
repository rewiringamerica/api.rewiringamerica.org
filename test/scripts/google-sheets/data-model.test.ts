import { test } from 'tap';
import { generateDataModelTable } from '../../../scripts/lib/google-sheets/data-model';
import { FieldMetadata } from '../../../scripts/lib/spreadsheet-mappings';

test('Creates correct data model sheet', tap => {
  const metadata: { [index: string]: FieldMetadata } = {
    fieldA: {
      column_aliases: ['Field A', 'unused alias'],
      description: 'The field you gotta have',
      critical: true,
    },
    fieldB: {
      column_aliases: ['Field B'],
      description: 'A less important field.',
    },
  };
  const output = generateDataModelTable(metadata);

  const expected = {
    data: [
      {
        rowData: [
          {
            values: [
              {},
              {
                userEnteredValue: { stringValue: 'Column Name' },
                userEnteredFormat: {
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.8509803921568627,
                      green: 0.8509803921568627,
                      blue: 0.8509803921568627,
                      alpha: 1,
                    },
                  },
                  textFormat: { bold: true, fontSize: 12 },
                  borders: { bottom: { style: 'SOLID_THICK' } },
                },
              },
              {
                userEnteredValue: { stringValue: 'Definition' },
                userEnteredFormat: {
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.8509803921568627,
                      green: 0.8509803921568627,
                      blue: 0.8509803921568627,
                      alpha: 1,
                    },
                  },
                  textFormat: { bold: true, fontSize: 12 },
                  borders: { bottom: { style: 'SOLID_THICK' } },
                },
              },
            ],
          },
          {
            values: [
              {},
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
                  wrapStrategy: 'WRAP',
                  textFormat: { bold: true },
                },
              },
              {
                userEnteredValue: { stringValue: 'The field you gotta have' },
                userEnteredFormat: {
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                  wrapStrategy: 'WRAP',
                },
              },
            ],
          },
          {
            values: [
              {},
              {
                userEnteredValue: { stringValue: 'Field B' },
                userEnteredFormat: {
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                  wrapStrategy: 'WRAP',
                  textFormat: { bold: true },
                },
              },
              {
                userEnteredValue: { stringValue: 'A less important field.' },
                userEnteredFormat: {
                  backgroundColorStyle: {
                    rgbColor: {
                      red: 0.9529411764705882,
                      green: 0.9529411764705882,
                      blue: 0.9529411764705882,
                      alpha: 1,
                    },
                  },
                  wrapStrategy: 'WRAP',
                },
              },
            ],
          },
        ],
        columnMetadata: [
          { pixelSize: 31 },
          { pixelSize: 182 },
          { pixelSize: 489 },
        ],
      },
    ],
    properties: { title: 'Incentives Data Model - Baseline' },
  };

  tap.strictSame(output, expected);
  tap.end();
});
