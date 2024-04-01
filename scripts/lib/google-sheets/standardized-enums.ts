import { sheets_v4 } from 'googleapis';
import { FieldMetadata } from '../spreadsheet-mappings';

const headerRowFormat: sheets_v4.Schema$CellFormat = {
  backgroundColorStyle: {
    rgbColor: {
      red: 243 / 255,
      green: 243 / 255,
      blue: 243 / 255,
      alpha: 1,
    },
  },
  textFormat: {
    bold: true,
  },
  borders: {
    bottom: {
      style: 'SOLID',
    },
    left: {
      style: 'SOLID',
    },
    right: {
      style: 'SOLID',
    },
  },
  wrapStrategy: 'WRAP',
};

const dataRowFormat: sheets_v4.Schema$CellFormat = {
  wrapStrategy: 'WRAP',
  borders: {
    top: {
      style: 'SOLID',
    },
    bottom: {
      style: 'SOLID',
    },
    left: {
      style: 'SOLID',
    },
    right: {
      style: 'SOLID',
    },
  },
};

const blankCell = {
  userEnteredFormat: {
    wrapStrategy: 'WRAP',
  },
};

// Subset of FieldMetadata, and the values are an array rather than
// object for consistent ordering.
type OrderedValuesMetadata = {
  columnName: string;
  values: { value_aliases: string[]; description?: string }[];
};

export function generateStandardEnumsSheet(metadata: {
  [index: string]: FieldMetadata;
}): sheets_v4.Schema$Sheet {
  const rowData: sheets_v4.Schema$RowData[] = [];

  // Filter to the metadata where values is defined.
  const enumListsToWrite: OrderedValuesMetadata[] = Object.values(metadata)
    .filter(field => field.values)
    .map(field => {
      return {
        columnName: field.column_aliases[0],
        values: Object.values(field.values!),
      };
    });

  // Header Row.
  const headerRow: sheets_v4.Schema$CellData[] = [];
  for (const enumList of enumListsToWrite) {
    headerRow.push({
      userEnteredValue: { stringValue: enumList.columnName },
      userEnteredFormat: headerRowFormat,
    });
    headerRow.push({
      userEnteredValue: { stringValue: 'Definition' },
      userEnteredFormat: headerRowFormat,
    });
    // Column in between types
    headerRow.push({});
  }
  rowData.push({ values: headerRow });

  // Rest of table
  // Because Google Sheets API gives tables in rows, this is a bit awkward
  // since the data is organized in columns.
  const longestValueEnum = Math.max(
    ...enumListsToWrite.map(enumList => Object.keys(enumList.values!).length),
  );
  for (let i = 0; i < longestValueEnum; i++) {
    const dataRow: sheets_v4.Schema$CellData[] = [];
    for (const field of enumListsToWrite) {
      if (i < field.values.length) {
        dataRow.push({
          userEnteredValue: { stringValue: field.values[i].value_aliases[0] },
          userEnteredFormat: dataRowFormat,
        });
        if (field.values[i].description) {
          dataRow.push({
            userEnteredValue: { stringValue: field.values[i].description },
            userEnteredFormat: dataRowFormat,
          });
        } else {
          // Still want borders for empty descriptions.
          dataRow.push({ userEnteredFormat: dataRowFormat });
        }
        // Gap between enums.
        dataRow.push(blankCell);
      } else {
        dataRow.push(blankCell, blankCell, blankCell);
      }
    }
    rowData.push({ values: dataRow });
  }
  const columnSizes = [];
  for (let i = 0; i < enumListsToWrite.length; i++) {
    columnSizes.push({ pixelSize: 125 }, { pixelSize: 125 });
    // No need for spacer column after the last enum.
    if (i !== enumListsToWrite.length - 1) {
      columnSizes.push({ pixelSize: 50 });
    }
  }
  return {
    data: [
      {
        rowData,
        columnMetadata: columnSizes,
      },
    ],
    properties: {
      title: 'Standardized Enum List Values',
      sheetId: 1,
    },
    protectedRanges: [
      {
        range: {
          sheetId: 1,
        },
        requestingUserCanEdit: true,
        // We discourage changes, but want to enable data collectors to make
        // them when there need to be changes to our schema.
        warningOnly: true,
      },
    ],
  };
}
