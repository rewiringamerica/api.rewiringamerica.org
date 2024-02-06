import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import minimist from 'minimist';
import { CollectedStateIncentive } from '../src/data/state_incentives';
import { csvToJsonData } from './lib/format-converter';

function convertCsvToJson(inputPath: string, outputPath: string) {
  const csvContent = fs.readFileSync(inputPath);
  const rows = parse(csvContent, {
    columns: true,
  });

  const [valids, invalids] = csvToJsonData(rows);

  fs.writeFileSync(
    outputPath,
    JSON.stringify(valids, null, 2) + '\n', // include newline to satisfy prettier
    'utf-8',
  );
  const invalidsFilePath = outputPath.replace('.', '_invalid.');
  if (invalids.length === 0) {
    if (fs.existsSync(invalidsFilePath)) {
      // Clear any previous versions if we have no invalid records.
      fs.unlinkSync(invalidsFilePath);
    }
  } else {
    fs.writeFileSync(
      invalidsFilePath,
      JSON.stringify(invalids, null, 2) + '\n', // include newline to satisfy prettier
      'utf-8',
    );
  }
}

// Can eventually generate this directly from the schema.
const KEYS = [
  'id',
  'data_urls',
  'authority_type',
  'authority_name',
  'program_title',
  'program_url',
  'item',
  'technology_if_selected_other',
  'short_description.en',
  'program_status',
  'program_start_raw',
  'program_end_raw',
  'payment_methods',
  'rebate_value',
  'amount.type',
  'amount.number',
  'amount.unit',
  'amount.minimum',
  'amount.maximum',
  'amount.representative',
  'bonus_description',
  'equipment_standards_restrictions',
  'equipment_capacity_restrictions',
  'contractor_restrictions',
  'income_restrictions',
  'tax_filing_status_restrictions',
  'owner_status',
  'other_restrictions',
  'stacking_details',
  'financing_details',
  'editorial_notes',
];

function convertJsonToCsv(inputPath: string, outputPath: string) {
  const incentives: CollectedStateIncentive[] = JSON.parse(
    fs.readFileSync(inputPath, 'utf-8'),
  );
  const output = stringify(incentives, {
    header: true,
    // stringify treats column name with periods as referring
    // to nested properties; this is exactly what we want.
    columns: KEYS,
    cast: {
      object: function (val) {
        // Special handling for arrays.
        if (Array.isArray(val)) {
          return val.join(', ');
        } else {
          // This is the default object transformation.
          return JSON.stringify(val);
        }
      },
    },
  });
  fs.writeFileSync(outputPath, output, 'utf-8');
}

(async function () {
  const args = minimist(process.argv.slice(2), { string: ['input', 'output'] });
  if (!args.input) throw new Error('Specify input file with --input');
  if (!args.output) throw new Error('Specify output file with --output');

  if (!fs.existsSync(args.input)) {
    throw new Error(`Input filepath ${args.input} does not exist`);
  }
  if (args.input.endsWith('.json')) {
    convertJsonToCsv(args.input, args.output);
  } else if (args.input.endsWith('.csv')) {
    convertCsvToJson(args.input, args.output);
  }
})();
