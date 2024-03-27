import fs from 'fs';
import { google, sheets_v4 } from 'googleapis';
import minimist from 'minimist';
import { CollectedIncentive } from '../src/data/state_incentives';
import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
import { authorize } from './lib/auth-helper';
import { collectedIncentiveToGoogleSheet } from './lib/format-converter';
import { FIELD_MAPPINGS } from './lib/spreadsheet-mappings';

const INCENTIVE_SHEET_NAME = 'Incentives Data';

async function exportToGoogleSheets(state: string, file: IncentiveFile) {
  if (!file.collectedFilepath)
    throw new Error(
      `No collected data defined for state ${state}; modify spreadsheet registry.`,
    );

  const collected: CollectedIncentive[] = JSON.parse(
    fs.readFileSync(file.collectedFilepath!, 'utf-8'),
  );
  const sheet = collectedIncentiveToGoogleSheet(collected, FIELD_MAPPINGS);
  if (!sheet.properties) {
    sheet.properties = {};
  }
  sheet.properties.title = INCENTIVE_SHEET_NAME;

  const workbook: sheets_v4.Schema$Spreadsheet = {
    sheets: [
      sheet,
    ],
  };
  const auth = await authorize();
  if (!auth) {
    throw new Error(
      'Unable to authenticate to Google Sheets API. Confirm you have credentials in the secrets/ folder.',
    );
  }
  const sheetsClient = google.sheets({ version: 'v4', auth: auth });
  const resp = await sheetsClient.spreadsheets.create({
    requestBody: workbook,
  });

  if (resp.status !== 200) {
    throw new Error(`Spreadsheet creation failed: ${resp.statusText}`);
  }
  if (!resp.data.spreadsheetId) {
    throw new Error('Spreadsheet ID not returned from Google Sheets creation.');
  }
  console.log(`\nFinalizing Google spreadsheet: ${resp.data.spreadsheetUrl}\n`);

  // This next section is required because Google Sheets doesn't automatically
  // render URLs when written via API unless the hyperlinks are explicitly
  // supplied. This is hard to do via up-front processing. However, reading and
  // then re-writing the cell values triggers Google Sheets to format them.
  const valuesResp = await sheetsClient.spreadsheets.values.get({
    spreadsheetId: resp.data.spreadsheetId,
    range: INCENTIVE_SHEET_NAME, // Entire sheet name is a valid range.
  });
  if (valuesResp.status !== 200 || !valuesResp.data) {
    throw new Error(`Spreadsheet values read failed: ${valuesResp.statusText}`);
  }
  const valuesWrite = await sheetsClient.spreadsheets.values.update({
    spreadsheetId: resp.data.spreadsheetId,
    // The data returned in the read request is a subset of rows, and must
    // match the requestBody, so we can't use the sheet name here.
    range: valuesResp.data.range!,
    requestBody: valuesResp.data,
    valueInputOption: 'USER_ENTERED',
  });
  if (valuesWrite.status !== 200) {
    throw new Error(
      `Spreadsheet values write failed: ${valuesWrite.statusText}`,
    );
  }
  console.log('Spreadsheet finalized.');
}

(async function () {
  const args = minimist(process.argv.slice(2));

  const bad = args._.filter(f => !(f in FILES));
  if (bad.length) {
    console.error(
      `${bad.join(', ')} not valid (choices: ${Object.keys(FILES).join(', ')})`,
    );
    process.exit(1);
  }

  args._.forEach(async fileIdent => {
    await exportToGoogleSheets(fileIdent, FILES[fileIdent]);
  });
})();
