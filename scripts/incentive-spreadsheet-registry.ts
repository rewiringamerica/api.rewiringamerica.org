export type IncentiveFile = {
  filepath: string;
  sheetUrl: string;
  idHeader: string;
  enHeader: string;
  esHeader?: string;
  headerRowNumber?: number;
};

export const FILES: { [ident: string]: IncentiveFile } = {
  IRA: {
    filepath: 'data/ira_incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTt1X34nGvUZu8Z71S-P9voD_zL6zvNapDJcL-RbH8SohQYAKOMN7ZeAA4Ti130PFAjei4uHImyV6dg/pub?gid=0&single=true&output=csv',
    idHeader: 'ID',
    enHeader: 'Short Description (150 characters max)',
    esHeader: 'Short Description-Spanish',
  },
  RI: {
    filepath: 'data/RI/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSoBQdIvYNb9fRkFggllmLZmz9nwL6SYxM7cdsiTPDU90C0HXtFh2r1qlYKdfbTzzxiPZ0o4NpOva__/pub?gid=30198531&single=true&output=csv',
    headerRowNumber: 2,
    idHeader: 'ID',
    enHeader: 'Program Description (style guide)',
    esHeader: 'Program Description (Spanish)',
  },
};
