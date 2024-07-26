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
  try {
    // GENERAL_IMPORTS
    for (const path of GENERAL_IMPORTS) {
      const writeDirAndFilename = `data/${pathToFileName(path)}`;
      const data = await fetchData(path);
      writeFileSync(writeDirAndFilename, JSON.stringify(data, null, 2) + '\n');
      console.log(`Exported ${writeDirAndFilename}....`);
    }

    // STATE_IMPORTS
    for (const path of STATE_IMPORTS) {
      const data = await fetchData(path);
      writeDataToStatesDirectory(data, pathToFileName(path));
    }
  } catch (e) {
    console.error(e);
    console.log(STATE_IMPORTS, 'STATE_IMPORTS');
  }
}

async function fetchData(path: string) {
  const data_url = `${INCENTIVE_ADMIN_HOST}${path}`;
  console.log(`fetching data from ${data_url}`);
  return fetch(data_url).then(res => res.json());
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
