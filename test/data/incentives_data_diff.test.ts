import minimist from 'minimist';
import { test } from 'tap';
import fs = require('node:fs');
import path = require('path');

import {
  CT_INCENTIVES,
  NY_INCENTIVES,
  RI_INCENTIVES,
  VA_INCENTIVES,
} from '../../src/data/state_incentives';

import { IRA_INCENTIVES } from '../../src/data/ira_incentives';

const TESTS = [
  [IRA_INCENTIVES, 'ira'],
  [CT_INCENTIVES, 'ct'],
  [NY_INCENTIVES, 'ny'],
  [RI_INCENTIVES, 'ri'],
  [VA_INCENTIVES, 'va'],
];

const GOLDEN_DIR = 'test/fixtures/incentive_goldens';
const STATE_INCENTIVE_DIR = 'data';
const TEST_FILE_SUFFIX = '.json';
const UPDATE_COMMAND = `'tsc && node build/test/data/incentives_data_diff.test.js --write'`;
const args = minimist(process.argv.slice(2), { boolean: ['write'] });

/*
The tests in this file are change detection tests on the incentive data
that are served by the API to ensure we don't make accidental changes to it.

It is expected that many changes will require updating the golden files; follow
the instructions in the test to do so and check in the new goldens as part of
your PR.
*/
if (args.write) {
  TESTS.forEach(([schema, prefix]) => {
    const golden = prefix + TEST_FILE_SUFFIX;
    fs.writeFileSync(
      path.join(GOLDEN_DIR, golden),
      JSON.stringify(schema, null, 2) + '\n',
    );
  });
} else {
  test('incentive files match goldens', tap => {
    tap.plan(TESTS.length);

    TESTS.forEach(([schema, prefix]) => {
      const golden = prefix + TEST_FILE_SUFFIX;
      try {
        const json = JSON.parse(
          fs.readFileSync(path.join(GOLDEN_DIR, golden), { encoding: 'utf8' }),
        );
        tap.matchOnly(
          json,
          schema,
          `This test detects changes in incentives data. If this is intentional, update goldens by running ${UPDATE_COMMAND}`,
        );
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.error(`Invalid JSON in ${golden}`);
        } else {
          console.error(
            `Missing golden: ${golden}. You can update goldens with ${UPDATE_COMMAND}`,
          );
        }
      }
    });
  });

  test('ensure all state incentives files have golden coverage', tap => {
    // This test depends on a known location for state incentive data folders
    // and that state incentive data folders will use their two-letter abbreviation.
    const folders = fs.readdirSync(STATE_INCENTIVE_DIR);
    for (const folder of folders) {
      if (
        fs.lstatSync(path.join(STATE_INCENTIVE_DIR, folder)).isDirectory() &&
        folder.length === 2
      ) {
        const expectedGolden = folder.toLowerCase() + TEST_FILE_SUFFIX;
        tap.equal(
          fs.existsSync(path.join(GOLDEN_DIR, expectedGolden)),
          true,
          `Missing coverage for ${expectedGolden}. To fix, add coverage for the new folder(s), then update goldens by running ${UPDATE_COMMAND}`,
        );
      }
    }
    tap.end();
  });
}
