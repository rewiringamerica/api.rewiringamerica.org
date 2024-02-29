export type IncentiveFile = {
  filepath: string;
  sheetUrl: string;
  idHeader: string;
  enHeader: string;
  esHeader?: string;
  headerRowNumber?: number;
  runSpreadsheetHealthCheck?: boolean;
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
  CO: {
    filepath: 'data/CO/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1nITjSNRWJjSusB0fWuSS63fqynm_4Co7KEeuo9Cm7fU/pub?gid=30198531&single=true&output=csv',
    headerRowNumber: 2,
    idHeader: 'ID',
    enHeader: 'Program Description (guideline)',
    esHeader: 'Program Description (Spanish)',
    runSpreadsheetHealthCheck: true,
  },
  CT: {
    filepath: 'data/CT/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGd0l3oNXGgLOkM2DUtWGURg640oaurqyHkJ0vQDVXRWd8TDfoGGAEgAIEkPWXLuMEPGiWSOeUTcOY/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
    idHeader: 'ID',
    enHeader: 'Program Description (guideline)',
    esHeader: 'Program Description (Spanish)',
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
  AZ: {
    filepath: 'data/AZ/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQEGP5ZcMknLdHAqBAeCUtdkNPtS0CiFzQzoM4bdbLWYqC_30j1lHLeJhMSKElFRuwRdrgcd46Gl54j/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
    idHeader: 'ID',
    enHeader: 'Program Description (style guide)',
    runSpreadsheetHealthCheck: true,
  },
  IL: {
    filepath: 'data/IL/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vS2FQ0bImM65Gk0KFmDIhXZXCExrh605eWGscPXLPY5Kz_rQWG8KtyNJo82vYZMngTlSCCHfkYLFsUt/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
    idHeader: 'ID',
    enHeader: 'Program Description (guideline)',
    esHeader: 'Program Description (Spanish)',
  },
  NV: {
    filepath: 'data/NV/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTmxGiQVAxehqTk76ej-y5BwoqmnLiE7Cq_1QGnaGokKG3-EYlZIFoZEa3KAv7HK3xdN2AxvGggFLAK/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
    idHeader: 'ID',
    enHeader: 'Program Description (guildeline)',
  },
  WI: {
    filepath: 'data/WI/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSxNnovJ_viGErGJIkLL8uyXNx6QWKSgLZlntceubHXeYbb_s3Ksjxgg6ZSU8MiayjtmaMUpiHC1ue9/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
    idHeader: 'ID',
    enHeader: 'Program Description (style guide)',
    runSpreadsheetHealthCheck: true,
  },
};
