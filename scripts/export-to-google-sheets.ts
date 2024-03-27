import fs from 'fs';
import { google, sheets_v4 } from 'googleapis';
import minimist from 'minimist';
import { CollectedIncentive } from '../src/data/state_incentives';
import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
import { authorize } from './lib/auth-helper';
import { collectedIncentiveToGoogleSheet } from './lib/google-sheets-exporter';
import { FIELD_MAPPINGS } from './lib/spreadsheet-mappings';

async function exportToGoogleSheets(state: string, file: IncentiveFile) {
  if (!file.collectedFilepath)
    throw new Error(
      `No collected data defined for state ${state}; modify spreadsheet registry.`,
    );

  const collected: CollectedIncentive[] = JSON.parse(
    fs.readFileSync(file.collectedFilepath!, 'utf-8'),
  );
  const sheet = collectedIncentiveToGoogleSheet(
    collected,
    FIELD_MAPPINGS,
    true,
  );
  if (!sheet.properties) {
    sheet.properties = {};
  }
  sheet.properties.title = 'Incentives Data';

  const workbook: sheets_v4.Schema$Spreadsheet = {
    sheets: [
      sheet,
    ],
  };
  const auth = await authorize();
  if (auth) {
    const sheetsClient = google.sheets({ version: 'v4', auth: auth });
    const resp = await sheetsClient.spreadsheets.create({
      requestBody: workbook,
    });

    console.log(`\nGoogle spreadsheet created: ${resp.data.spreadsheetUrl}\n`);
  }
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
