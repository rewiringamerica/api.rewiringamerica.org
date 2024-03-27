import { sheets_v4 } from 'googleapis';
import { FieldMetadata } from './spreadsheet-mappings';

const headerRowFormat: sheets_v4.Schema$CellFormat = {
  backgroundColorStyle: {
    rgbColor: {
      red: 217 / 255,
      green: 217 / 255,
      blue: 217 / 255,
      alpha: 1,
    },
  },
  textFormat: {
    bold: true,
  },
  borders: {
    bottom: {
      style: 'SOLID_THICK',
    },
  },
};

const dataRowFormat = {
  backgroundColorStyle: {
    rgbColor: {
      red: 243 / 255,
      green: 243 / 255,
      blue: 243 / 255,
      alpha: 1,
    },
  },
};

export function generateDataModelTable(metadata: {
  [index: string]: FieldMetadata;
}): sheets_v4.Schema$Sheet {
  const rowData: sheets_v4.Schema$RowData[] = [];

  // Header Row.
  const headerRow: sheets_v4.Schema$CellData[] = [];
  // Blank first column.
  headerRow.push({});
  const headerValues = ['Column Name', 'Definition'];
  for (const header of headerValues) {
    headerRow.push({
      userEnteredValue: { stringValue: header },
      userEnteredFormat: headerRowFormat,
    });
  }
  rowData.push({ values: headerRow });

  // Rest of table
  for (const data of Object.values(metadata)) {
    const dataRow: sheets_v4.Schema$CellData[] = [];
    // Blank first column.
    dataRow.push({});
    dataRow.push({
      userEnteredValue: { stringValue: data.column_aliases[0] },
      userEnteredFormat: {
        ...dataRowFormat,
        ...{ textFormat: { bold: true } },
      },
    });
    dataRow.push({
      userEnteredValue: { stringValue: data.description },
      userEnteredFormat: dataRowFormat,
    });
    rowData.push({ values: dataRow });
  }
  return {
    data: [
      {
        rowData,
      },
    ],
    properties: {
      title: 'Incentives Data Model - Baseline',
    },
  };
}
