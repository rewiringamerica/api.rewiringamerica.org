import { sheets_v4 } from 'googleapis';

export const standardValueCellFormat: sheets_v4.Schema$CellFormat = {
  borders: {
    top: { style: 'SOLID' },
    bottom: { style: 'SOLID' },
    left: { style: 'SOLID' },
    right: { style: 'SOLID' },
  },
  wrapStrategy: 'WRAP',
  verticalAlignment: 'TOP',
};

export const headerBaseFormat: sheets_v4.Schema$CellFormat = {
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

export const rebateFieldsColor: sheets_v4.Schema$CellFormat = {
  backgroundColorStyle: {
    rgbColor: {
      red: 180 / 255,
      green: 167 / 255,
      blue: 214 / 255,
      alpha: 1,
    },
  },
};

export const restrictionsConditionsColor: sheets_v4.Schema$CellFormat = {
  backgroundColorStyle: {
    rgbColor: {
      red: 208 / 255,
      green: 224 / 255,
      blue: 227 / 255,
      alpha: 1,
    },
  },
};
