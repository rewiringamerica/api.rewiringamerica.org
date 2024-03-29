import { sheets_v4 } from 'googleapis';
import util from 'util';
import { CollectedIncentive } from '../../../src/data/state_incentives';
import {
  SpreadsheetData,
  colToLetter,
  collectedIncentivesToSpreadsheet,
} from '../format-converter';
import { AliasMap } from '../spreadsheet-mappings';

const REBATE_AMOUNT_FIELDS_START = 15; // inclusive
const REBATE_AMOUNT_FIELDS_END = 22; // exclusive
const RESTRICTIONS_CONDITIONS_START = 23; // inclusive
const RESTRICTIONS_CONDITIONS_END = 30; // exclusive

const standardValueCellFormat: sheets_v4.Schema$CellFormat = {
  borders: {
    top: { style: 'SOLID' },
    bottom: { style: 'SOLID' },
    left: { style: 'SOLID' },
    right: { style: 'SOLID' },
  },
  wrapStrategy: 'WRAP',
  verticalAlignment: 'TOP',
};

const headerBaseFormat: sheets_v4.Schema$CellFormat = {
  horizontalAlignment: 'CENTER',
  textFormat: {
    bold: true,
  },
  wrapStrategy: 'WRAP',
  backgroundColorStyle: {
    rgbColor: {
      red: 243 / 255,
      green: 243 / 255,
      blue: 243 / 255,
      alpha: 1,
    },
  },
};

const rebateFieldsColor: sheets_v4.Schema$CellFormat = {
  backgroundColorStyle: {
    rgbColor: {
      red: 180 / 255,
      green: 167 / 255,
      blue: 214 / 255,
      alpha: 1,
    },
  },
};

const restrictionsConditionsColor: sheets_v4.Schema$CellFormat = {
  backgroundColorStyle: {
    rgbColor: {
      red: 208 / 255,
      green: 224 / 255,
      blue: 227 / 255,
      alpha: 1,
    },
  },
};

function createCellValue(
  colName: string,
  colValue: object | string | number | boolean,
): sheets_v4.Schema$ExtendedValue {
  let valToWrite: sheets_v4.Schema$ExtendedValue = {};
  if (Array.isArray(colValue)) {
    valToWrite = { stringValue: colValue.join(', ') };
  } else if (typeof colValue === 'string') {
    valToWrite = { stringValue: colValue };
  } else if (typeof colValue === 'boolean') {
    valToWrite = { boolValue: colValue };
  } else if (typeof colValue === 'number') {
    valToWrite = { numberValue: +colValue };
  } else if (typeof colValue === 'object') {
    throw new Error(
      `Trying to write object to spreadsheet. Objects should be flattened prior to write. Column name: ${colName}; value: ${util.inspect(
        colValue,
      )}`,
    );
  } else {
    console.warn(
      `Unexpected value type: ${colName}: ${util.inspect(
        colValue,
      )}. Writing as string.`,
    );
    valToWrite = { stringValue: colValue };
  }
  return valToWrite;
}

export function collectedIncentiveToGoogleSheet(
  incentives: CollectedIncentive[],
  fieldMappings: AliasMap,
  useStandardHeader: boolean,
  descriptionColumnName?: string,
) {
  const spreadsheetData = collectedIncentivesToSpreadsheet(
    incentives,
    fieldMappings,
  );
  return spreadsheetToGoogleSheet(
    spreadsheetData,
    useStandardHeader,
    descriptionColumnName,
  );
}

// descriptionColumnName is used to add formulas that depend on that column.
// It's not required if you don't want them added.
export function spreadsheetToGoogleSheet(
  spreadsheet: SpreadsheetData,
  useStandardHeader: boolean,
  descriptionColumnName?: string,
) {
  const { records, headers } = spreadsheet;

  let descCol: string;
  if (descriptionColumnName) {
    if (!headers.includes(descriptionColumnName)) {
      throw new Error(
        `Formula columns requested, but couldn't find the short_description column. Expected column name: ${descriptionColumnName}`,
      );
    } else {
      descCol = colToLetter(1 + headers.indexOf(descriptionColumnName));
    }
  }
  const numHeaders = useStandardHeader ? 2 : 1;

  let rowData: sheets_v4.Schema$RowData[] = [];
  records.forEach((record, rowInd) => {
    const rowValues: sheets_v4.Schema$CellData[] = [];
    for (const col of headers) {
      const cell: sheets_v4.Schema$CellData = {
        userEnteredFormat: standardValueCellFormat,
      };
      if (col in record) {
        cell.userEnteredValue = createCellValue(col, record[col]);
      }
      rowValues.push(cell);
    }
    if (descriptionColumnName) {
      const descCellAddress = `${descCol}${rowInd + numHeaders + 1}`;
      rowValues.push({
        userEnteredFormat: standardValueCellFormat,
        userEnteredValue: {
          formulaValue: `=LEN(${descCellAddress})`,
        },
      });
      rowValues.push({
        userEnteredFormat: standardValueCellFormat,
        userEnteredValue: {
          formulaValue: `=IF(${descCellAddress}="","",COUNTA(SPLIT(${descCellAddress}," ")))`,
        },
      });
    }
    rowData.push({ values: rowValues });
  });
  // Prepend the headers.
  const headerRows: sheets_v4.Schema$RowData[] = [];
  if (useStandardHeader) {
    const optionalHeaderRow: sheets_v4.Schema$CellData[] = [];
    for (let i = 0; i < headers.length; i++) {
      if (i === REBATE_AMOUNT_FIELDS_START) {
        const heading = 'Rebate Amount Fields (guidelines)';
        optionalHeaderRow.push({
          userEnteredValue: {
            stringValue: heading,
          },
          userEnteredFormat: { ...headerBaseFormat, ...rebateFieldsColor },
          textFormatRuns: [
            {
              // start index of link
              startIndex: heading.indexOf('guidelines'),
              format: {
                link: {
                  uri: 'https://docs.google.com/document/d/1nM9320uOUYpfpD3eZ4DFo32Scd5kauLEL17j1NYB5Ww/edit#bookmark=id.s9a0j7v2m6vb',
                },
              },
            },
            {
              // end index (start plus length of 'guidelines')
              startIndex: heading.indexOf('guidelines') + 10,
            },
          ],
        });
      } else if (i === RESTRICTIONS_CONDITIONS_START) {
        optionalHeaderRow.push({
          userEnteredValue: {
            stringValue: 'Restrictions / Eligibility Conditions',
          },
          userEnteredFormat: {
            ...headerBaseFormat,
            ...restrictionsConditionsColor,
          },
        });
      } else {
        optionalHeaderRow.push({});
      }
    }
    headerRows.push({ values: optionalHeaderRow });
  }
  const primaryHeaderRow: sheets_v4.Schema$CellData[] = [];
  headers.forEach((col, ind) => {
    let format: sheets_v4.Schema$CellFormat = { ...headerBaseFormat };
    if (ind >= REBATE_AMOUNT_FIELDS_START && ind < REBATE_AMOUNT_FIELDS_END) {
      format = { ...format, ...rebateFieldsColor };
    } else if (
      ind >= RESTRICTIONS_CONDITIONS_START &&
      ind < RESTRICTIONS_CONDITIONS_END
    ) {
      format = { ...format, ...restrictionsConditionsColor };
    }
    primaryHeaderRow.push({
      userEnteredValue: { stringValue: col },
      userEnteredFormat: format,
    });
  });
  if (descriptionColumnName) {
    primaryHeaderRow.push({
      userEnteredFormat: headerBaseFormat,
      userEnteredValue: { stringValue: 'Description character count' },
    });
    primaryHeaderRow.push({
      userEnteredFormat: headerBaseFormat,
      userEnteredValue: { stringValue: 'Description word count' },
    });
  }
  headerRows.push({ values: primaryHeaderRow });
  rowData = [...headerRows, ...rowData];
  const output: sheets_v4.Schema$Sheet = {
    data: [
      {
        rowData,
        columnMetadata: Array(headers.length).fill({ pixelSize: 150 }),
      },
    ],
    properties: {
      sheetId: 0,
      gridProperties: {
        frozenRowCount: useStandardHeader ? 2 : 1,
        frozenColumnCount: 1,
      },
    },
  };
  if (useStandardHeader) {
    output.merges = [
      {
        startRowIndex: 0,
        startColumnIndex: REBATE_AMOUNT_FIELDS_START,
        endRowIndex: 1,
        endColumnIndex: REBATE_AMOUNT_FIELDS_END,
        sheetId: 0,
      },
      {
        startRowIndex: 0,
        startColumnIndex: RESTRICTIONS_CONDITIONS_START,
        endRowIndex: 1,
        endColumnIndex: RESTRICTIONS_CONDITIONS_END,
        sheetId: 0,
      },
    ];
  }
  return output;
}
