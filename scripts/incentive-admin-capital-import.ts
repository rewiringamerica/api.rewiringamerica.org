/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeFileSync } from 'fs';

const INCENTIVE_ADMIN_HOST =
  process.env.INCENTIVE_ADMIN_HOST || 'http://localhost:3000/api/export';

const GENERAL_IMPORTS = ['/loan-programs?status=PUBLISHED'];

function pathToFileName(path: string) {
  // Remove query params and slashes; replace dashes with underscores
  return path.split('?')[0].replaceAll('/', '').replaceAll('-', '_') + '.json';
}

async function saveLoanProgramDataToDisk() {
  for (const path of GENERAL_IMPORTS) {
    const writeDirAndFilename = `data/${pathToFileName(path)}`;
    const data = await fetchCapitalData(path);
    try {
      writeFileSync(writeDirAndFilename, JSON.stringify(data, null, 2) + '\n');
    } catch (error) {
      console.error(`Failed to write data to ${writeDirAndFilename}:`, error);
      throw error;
    }
    console.log(`Exported ${writeDirAndFilename}...`);
  }
}

async function fetchCapitalData(path: string) {
  const data_url = `${INCENTIVE_ADMIN_HOST}${path}`;
  const authHeader = process.env.CAPITAL_ADMIN_API_KEY;
  console.log(`fetching data from ${data_url}`);

  try {
    const response = await fetch(data_url, {
      headers: {
        Authorization: `${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Error fetching data: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch data from ${data_url}:`, error);
    throw error;
  }
}

async function main() {
  console.log('Running incentive-admin-capital-import.ts');
  await saveLoanProgramDataToDisk();
  console.log('Finished running incentive-admin-capital-import.ts');
}

main();
