export type IncentiveFile = {
  filepath: string;
  collectedFilepath?: string;
  sheetUrl: string;
  headerRowNumber?: number;
  skipSpreadsheetHealthCheck?: boolean;
};

export const FILES: { [ident: string]: IncentiveFile } = {
  IRA: {
    filepath: 'data/ira_incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTt1X34nGvUZu8Z71S-P9voD_zL6zvNapDJcL-RbH8SohQYAKOMN7ZeAA4Ti130PFAjei4uHImyV6dg/pub?gid=0&single=true&output=csv',
    skipSpreadsheetHealthCheck: true,
  },
  AZ: {
    filepath: 'data/AZ/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQEGP5ZcMknLdHAqBAeCUtdkNPtS0CiFzQzoM4bdbLWYqC_30j1lHLeJhMSKElFRuwRdrgcd46Gl54j/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
  },
  CO: {
    filepath: 'data/CO/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1nITjSNRWJjSusB0fWuSS63fqynm_4Co7KEeuo9Cm7fU/pub?gid=30198531&single=true&output=csv',
    headerRowNumber: 2,
  },
  CT: {
    filepath: 'data/CT/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGd0l3oNXGgLOkM2DUtWGURg640oaurqyHkJ0vQDVXRWd8TDfoGGAEgAIEkPWXLuMEPGiWSOeUTcOY/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
    skipSpreadsheetHealthCheck: true,
  },
  DC: {
    filepath: 'data/DC/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQb8t0MXV32iNBujzP4s5saPZl7qpaBcVckDCqSwzHHKAQVdaQtBvE2FgPCv1XvwDGN5ORAlXtKMqmp/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
  },
  GA: {
    filepath: 'data/GA/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDKli_a0lss6rlzw08lEoFYskREZWsT1bGq0XHTa2jYqYiNarAMq76A20uC9rrg5bWqFSYeNY7W2gq/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
  },
  IL: {
    filepath: 'data/IL/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vS2FQ0bImM65Gk0KFmDIhXZXCExrh605eWGscPXLPY5Kz_rQWG8KtyNJo82vYZMngTlSCCHfkYLFsUt/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
  },
  ME: {
    filepath: 'data/ME/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTXQgolo6n_q0xJAWwbtzrhqh0ku5xuy0UUyOYNwHpT3Reh5wuY8Nk5cBllhN61hdW98_o38eGSVKx4/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
  },
  MI: {
    filepath: 'data/MI/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vThx1Nimf1NVxXxY5HRqg3EZU9FdoZSESPoLXFMxeGczR7vpjH16pNDRX6zPpNlz9aOGbcQivgnFtNK/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
  },
  NV: {
    filepath: 'data/NV/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTmxGiQVAxehqTk76ej-y5BwoqmnLiE7Cq_1QGnaGokKG3-EYlZIFoZEa3KAv7HK3xdN2AxvGggFLAK/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
  },
  // NY is deliberately omitted; the sheet and JSON are intentionally out of
  // sync for now. We wanted to start showing NY's EmPower+ program before QAing
  // all the incentives collected in the sheet.
  OR: {
    filepath: 'data/OR/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vReCvCaEUHSgbxRse-82kV6_P1FuvKwp6AO_Wi6D9GE6faBD4Vr8TjNkj07wH5WueuMlijtchmYOe22/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
  },
  PA: {
    filepath: 'data/PA/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRirR-JqM4dFnJsQetko0L6FMoV6jpY_NwS4j5mWUm9BYHuCzLut_7EdefMTGkv5sITDO_NgYKdOAU3/pub?gid=616584455&single=true&output=csv',
    headerRowNumber: 2,
  },
  RI: {
    filepath: 'data/RI/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSoBQdIvYNb9fRkFggllmLZmz9nwL6SYxM7cdsiTPDU90C0HXtFh2r1qlYKdfbTzzxiPZ0o4NpOva__/pub?gid=30198531&single=true&output=csv',
    headerRowNumber: 2,
  },
  VA: {
    filepath: 'data/VA/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSR3gOc40GeRzaYJwSn7MwKs7LQ2otHExlDWQb6AvfXHLzal-mt5b6IPGelDc6roSPgF-41GaU-L5Ae/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
    skipSpreadsheetHealthCheck: true,
  },
  VT: {
    filepath: 'data/VT/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTm6qcrCiLdhYDUak0m7sXWh6PGaDC8-kpmSOhoVmfwso_F9S029yhTZJV5Npvt2vdmpBztZj_ZtH7_/pub?gid=30198531&single=true&output=csv',
    headerRowNumber: 1,
  },
  WI: {
    filepath: 'data/WI/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSxNnovJ_viGErGJIkLL8uyXNx6QWKSgLZlntceubHXeYbb_s3Ksjxgg6ZSU8MiayjtmaMUpiHC1ue9/pub?gid=995688950&single=true&output=csv',
    headerRowNumber: 2,
  },
};
