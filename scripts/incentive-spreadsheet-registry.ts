export type IncentiveFile = {
  filepath?: string;
  sheetUrl: string;
  idHeader: string;
  enHeader: string;
  esHeader?: string;
  headerRowNumber?: number;
};

const fileDefaults = {
  idHeader: 'ID',
  headerRowNumber: 2,
  enHeader: 'Program Description (guideline)',
  esHeader: 'Program Description (Spanish)',
};

export const FILES: { [ident: string]: IncentiveFile } = {
  IRA: {
    ...fileDefaults,
    filepath: 'data/ira_incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTt1X34nGvUZu8Z71S-P9voD_zL6zvNapDJcL-RbH8SohQYAKOMN7ZeAA4Ti130PFAjei4uHImyV6dg/pub?gid=0&single=true&output=csv',
    enHeader: 'Short Description (150 characters max)',
    esHeader: 'Short Description-Spanish',
  },
  CO: {
    ...fileDefaults,
    filepath: 'data/CO/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1nITjSNRWJjSusB0fWuSS63fqynm_4Co7KEeuo9Cm7fU/pub?gid=30198531&single=true&output=csv',
  },
  RI: {
    filepath: 'data/RI/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSoBQdIvYNb9fRkFggllmLZmz9nwL6SYxM7cdsiTPDU90C0HXtFh2r1qlYKdfbTzzxiPZ0o4NpOva__/pub?gid=30198531&single=true&output=csv',
    headerRowNumber: 2,
    idHeader: 'ID',
    enHeader: 'Program Description (style guide)',
  },
  AZ: {
    ...fileDefaults,
    filepath: 'data/AZ/incentives.json',
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQEGP5ZcMknLdHAqBAeCUtdkNPtS0CiFzQzoM4bdbLWYqC_30j1lHLeJhMSKElFRuwRdrgcd46Gl54j/pub?gid=995688950&single=true&output=csv',
    enHeader: 'Program Description (style guide)',
  },
  NY: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1xXj-QQZy3jZT7gWtZ7cu8AR7ibjJ0Y2QYQRLk9hv6CU/edit#gid=30198531',
  },
  VT: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1mAHr_CQWwMpccOK6E1i09334GcojxGAN8Z4n-jO6cQg/edit#gid=30198531',
  },
  NC: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1TrRoCNbWuseVuI2PRtJ-xjzZ9Y8PFTpKpHAHHOEOh3U/edit#gid=995688950',
  },
  CT: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/13mJyltzLt4KTDuuL14r71HqKJU5c9f6bYJtGLotgkVI/edit#gid=995688950',
  },
  VA: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1LTp6oSZ_7dAAE33RgOqR99Ihok7lgJaMdm3piDRaboM/edit#gid=894925043',
  },
  CA: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1i7xKnAbZ8QyXQkGSHeK3qIYTY2J3HgHyoT12GVcDZao/edit#gid=995688950',
  },
  MN: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1FPbiz_Hvx8ync1RPw9e-yHDATs9fhhOHgHU8n-XjGRg/edit#gid=995688950',
  },
  NV: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1w6c4lAlNGTKEuN_X00mAcK3Xs6NGM1aT5XFbhjd1CGo/edit#gid=995688950',
  },
  WA: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/12b5zE8_IYnZ_g7EXCCcgLyHTO2WyeCWZVsITY9BBBxU/edit#gid=995688950',
  },
  NM: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1Qzvi9pBCkxhpJUVQVd1su_vpnd56l-irocfz1yiotdk/edit#gid=995688950',
  },

  IN: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/17qhBneg96zGd4g0HvrQJHPk8HnCuZFNhZXPTmcqW2Qo/edit?usp=sharing',
  },
  MT: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1unBB6Rst_5BAjT8E6vxGpEN8wyO0Eza8Sk2XRsHbmGQ/edit#gid=199321484',
  },

  GA: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1DH5Q6IzH-UhevG0jiQb7IrchU7GGkVsPoVMRTmS7tmU/edit?usp=sharing',
  },
  ID: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1w2ti407_StNoKvSmI0vOeLSM5ymaOrScehsVZr0SFr8/edit#gid=995688950',
  },
  IL: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1uQq5x8DSAI9AuLCTNSHxYkSC9V0EI3aEs3N8GL-TdBg/edit#gid=995688950',
  },
  IA: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1basHXVJmz-FBDKKD_wPJAzOa1fA3jx5iQdZBX0uMHoU/edit#gid=894925043',
  },

  MA: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1SwZ2ilxme5pS8BhsK-EJNl-gko-6O_RtnRmjp0LsP6c/edit?usp=sharing',
  },
  MI: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1BJRTPSxvz8IPpbIjAwdlCX78S15hilFPFH8oONiG_zI/edit?usp=sharing',
  },

  MO: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/19IjsWLUz3_AFHytUixpz9tchiGHrvIQrBLQ_OYTlahY/edit?usp=sharing',
  },

  NJ: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1txAOf27PE6nIr9r8Jo0T3Ta2QvmAgwq1FKwu4LmxAaQ/edit?usp=sharing',
  },
  NH: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1BnHZGqIbWn0N9rsSjgNB0PaUVXdNS3iS595Epdrb_cw/edit?usp=sharing',
  },

  OH: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1mBYJ4TB20isbK6T7uEDuBg0CIROmIi8Qj1HUKBg-R7I/edit?usp=sharing',
  },

  OR: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/10LYqYO-yd4vsUaDxba4NZvNU4er7LXytcmweZBJP3SI/edit?usp=sharing',
  },
  PA: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/179tAdAzCMb6A9gj5iyEZ3FH0W_wfS7_dpSzyR5-Ui18/edit?usp=sharing',
  },

  UT: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1sSYpKorqQ04NZDN1okUP_ZdHEGlctHawnv16KuJyxHI/edit#gid=995688950',
  },
  WV: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1oibT68yZGn8KoiiXlguE0zywnN_PCdWzu1QoDiF4cP8/edit?usp=sharing',
  },
  WI: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/17TtVE1gDiGSPnQRfQClrdVrzE2uvcYwD0k2PTAhi6Ts/edit?usp=sharing',
  },
  WY: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1ynWzgiH33OQhLagglSo3zqyuk6HLf9ZvzsTwgiWZQwg/edit?usp=sharing',
  },
  AK: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1-BAJxp-0AocQX5ZUhYwGYh8xs45uL5r1V9NF5CduQJQ/edit#gid=995688950',
  },
  HI: {
    ...fileDefaults,
    sheetUrl:
      'https://docs.google.com/spreadsheets/d/1lLPTtvVM_2d4pMJz4snvaKxWtOlMKhmk5CmKn9yNaiE/edit?usp=sharing',
  },
};
