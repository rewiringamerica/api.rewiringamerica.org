/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeFileSync } from 'fs';
import { join } from 'path';

type StateGroupedData = {
  [state: string]: Record<string, any>;
};

const INCENTIVE_ADMIN_HOST =
  process.env.INCENTIVE_ADMIN_HOST || 'http://localhost:3000/api/export';

const STATE_IMPORTS = [
  '/authorities',
  '/incentives',
  '/incentive-relationships',
  '/programs',
];

const GENERAL_IMPORTS = [
  '/geo-groups',
  '/low-income-thresholds',
];

function pathToFileName(path: string) {
  return path.replaceAll('/', '').replaceAll('-', '_') + '.json';
}

async function saveIncentiveDataToDisk() {
  // GENERAL_IMPORTS
  for (const path of GENERAL_IMPORTS) {
    const writeDirAndFilename = `data/${pathToFileName(path)}`;
    const data = await fetchData(path);
    if (data.error) {
      throw new Error(`Could not fetch data from ${path}`);
    }
    writeFileSync(writeDirAndFilename, JSON.stringify(data, null, 2) + '\n');
    console.log(`Exported ${writeDirAndFilename}....`);
  }

  // STATE_IMPORTS
  for (const path of STATE_IMPORTS) {
    const data = await fetchData(path);
    if (data.error) {
      throw new Error(`Could not fetch data from ${path}`);
    }
    writeDataToStatesDirectory(data, pathToFileName(path));
  }

  // zip-to-utility.csv
  const writePath = 'scripts/data/zip-to-utility.csv';
  const data = await fetchZipToUtility();
  writeFileSync(writePath, data);
  console.log(`Exported ${writePath}...`);
}

async function fetchData(path: string) {
  const dataUrl = `${INCENTIVE_ADMIN_HOST}${path}`;
  console.log(`fetching data from ${dataUrl}`);
  return fetch(dataUrl).then(res => res.json());
}

async function fetchZipToUtility(): Promise<string> {
  const dataUrl = `${INCENTIVE_ADMIN_HOST}/zip-to-utility`;
  console.log(`fetching data from ${dataUrl}`);
  // The endpoint outputs CSV directly
  const resp = await fetch(dataUrl); //fetch(dataUrl).then(res => res.text());
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Could not fetch data from ${dataUrl}`);
  }
  return text;
}

// Write data to states directory, expects data is organized by state.
function writeDataToStatesDirectory(data: StateGroupedData, fileName: string) {
  const writeDir = 'data/';
  // iterate over states
  for (const [currentState, records] of Object.entries(data)) {
    const writeDirAndFilename = join(
      writeDir,
      `${currentState.toUpperCase()}/${fileName}`,
    );
    writeFileSync(
      writeDirAndFilename,
      JSON.stringify(records, null, 2) + '\n',
      'utf-8',
    );

    console.log(`Exported ${currentState} ${fileName}....`);
  }
}

async function main() {
  console.log('Running incentive-admin-import.ts');
  await saveIncentiveDataToDisk();
  console.log('Finished running incentive-admin-import.ts');
}

main();
